using System.Text.Json;

namespace ChurchMap.Api.Services;

/// <summary>Elemento retornado pela Overpass API (node, way ou relation).</summary>
public class ChurchElement
{
    public long Id { get; set; }
    public string Type { get; set; } = "";
    public double Lat { get; set; }
    public double Lon { get; set; }
    public Dictionary<string, string> Tags { get; set; } = [];

    public string Name => Tags.GetValueOrDefault("name", Tags.GetValueOrDefault("name:pt", "Igreja sem nome"));
    public string? Denomination => Tags.GetValueOrDefault("denomination");
    public string? Street => Tags.GetValueOrDefault("addr:street");
    public string? HouseNumber => Tags.GetValueOrDefault("addr:housenumber");
    public string? Suburb => Tags.GetValueOrDefault("addr:suburb");
    public string? City => Tags.GetValueOrDefault("addr:city");
}

/// <summary>Informações geográficas de uma localidade resolvidas pelo Nominatim.</summary>
public record LocationInfo(long AreaId, double MinLat, double MaxLat, double MinLon, double MaxLon);

/// <summary>Consulta a Overpass API para buscar igrejas em uma localidade.</summary>
public class OverpassService
{
    private readonly HttpClient _http;
    private readonly ILogger<OverpassService> _logger;

    // Mirrors em ordem de preferência — tentados em sequência até um responder
    private static readonly string[] Mirrors =
    [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.openstreetmap.ru/api/interpreter",
        "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    ];

    public OverpassService(HttpClient http, ILogger<OverpassService> logger)
    {
        _http = http;
        _logger = logger;
    }

    /// <summary>
    /// Usa o Nominatim para resolver o nome da localidade em um AreaId Overpass + bounding box.
    /// Retorna null se não encontrar.
    /// </summary>
    private async Task<LocationInfo?> ResolveLocationAsync(string locationName, CancellationToken ct)
    {
        try
        {
            var q = Uri.EscapeDataString(locationName);
            var url = $"https://nominatim.openstreetmap.org/search?q={q}&format=json&limit=10&accept-language=pt";

            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.Add("User-Agent", "ChurchMapMonitor/1.0 (educational project)");

            using var nominatimCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            nominatimCts.CancelAfter(TimeSpan.FromSeconds(15));

            var resp = await _http.SendAsync(req, nominatimCts.Token);
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Nominatim retornou {Status} para '{Location}'", resp.StatusCode, locationName);
                return null;
            }

            var json = await resp.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);

            foreach (var item in doc.RootElement.EnumerateArray())
            {
                var osmType = item.TryGetProperty("osm_type", out var t) ? t.GetString() : null;
                if (osmType != "relation") continue;

                var cls  = item.TryGetProperty("class", out var c)  ? c.GetString()  : "";
                var type = item.TryGetProperty("type",  out var tp) ? tp.GetString() : "";
                if (cls  is not ("boundary" or "place")) continue;
                if (type is not ("administrative" or "city" or "town" or "municipality")) continue;

                var osmId  = item.GetProperty("osm_id").GetInt64();
                var areaId = 3_600_000_000L + osmId;

                // boundingbox: ["minlat","maxlat","minlon","maxlon"]
                if (!item.TryGetProperty("boundingbox", out var bb)) continue;
                var bba = bb.EnumerateArray().Select(x => double.Parse(x.GetString()!, System.Globalization.CultureInfo.InvariantCulture)).ToArray();
                if (bba.Length < 4) continue;

                var info = new LocationInfo(areaId, bba[0], bba[1], bba[2], bba[3]);
                _logger.LogInformation(
                    "Nominatim resolveu '{Location}' → relation {OsmId} → area {AreaId} bbox [{S},{N},{W},{E}]",
                    locationName, osmId, areaId, info.MinLat, info.MaxLat, info.MinLon, info.MaxLon);
                return info;
            }

            _logger.LogWarning("Nominatim não encontrou relation administrativa para '{Location}'", locationName);
            return null;
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "Nominatim lookup falhou para '{Location}'", locationName);
            return null;
        }
    }

    /// <summary>Busca igrejas na Overpass API para a localidade informada.</summary>
    public async Task<List<ChurchElement>> SearchAsync(string locationName, CancellationToken ct = default)
    {
        // Estratégia de busca em quatro níveis, do mais rápido ao mais genérico:
        //
        // 0) Bbox (bounding box): mais rápido — Overpass usa índice espacial simples, sem cálculo
        //    de polígono. Pode incluir alguns elementos de cidades vizinhas nas bordas, mas é
        //    suficiente para monitoramento e muito mais rápido que as alternativas abaixo.
        //
        // 1) area(id) direto via Nominatim: polígono exato do município mas mais pesado no servidor.
        //
        // 2) relation → map_to_area: resolve o polígono a partir do nome, mais lento ainda.
        //
        // 3) area layer + nome: fallback genérico, menos preciso.
        //
        // Usa node+way em vez de nwr: igrejas mapeadas como relation são raras e o custo
        // extra não vale a pena.

        var loc = await ResolveLocationAsync(locationName, ct);

        // ─── Nível 0: bbox ───────────────────────────────────────────────────────────
        if (loc is not null)
        {
            var bboxQuery = $"""
                [out:json][timeout:60];
                (
                  node["amenity"="place_of_worship"]({loc.MinLat},{loc.MinLon},{loc.MaxLat},{loc.MaxLon});
                  way["amenity"="place_of_worship"]({loc.MinLat},{loc.MinLon},{loc.MaxLat},{loc.MaxLon});
                  node["building"~"^(church|chapel|cathedral|basilica|shrine)$"]({loc.MinLat},{loc.MinLon},{loc.MaxLat},{loc.MaxLon});
                  way["building"~"^(church|chapel|cathedral|basilica|shrine)$"]({loc.MinLat},{loc.MinLon},{loc.MaxLat},{loc.MaxLon});
                );
                out center tags;
                """;

            try
            {
                var bboxResult = await ExecuteQueryAsync(bboxQuery, ct);
                if (bboxResult.Count > 0)
                {
                    _logger.LogInformation("Overpass retornou {Count} elementos via bbox para '{Location}'.", bboxResult.Count, locationName);
                    return bboxResult;
                }
                _logger.LogWarning("Bbox retornou 0 resultados para '{Location}'. Tentando area(id).", locationName);
            }
            catch (Exception ex) when (!ct.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "Bbox query falhou para '{Location}'. Tentando area(id).", locationName);
            }
        }

        // ─── Nível 1: area(id) ───────────────────────────────────────────────────────
        if (loc is not null)
        {
            var areaIdQuery = $"""
                [out:json][timeout:90];
                area({loc.AreaId})->.searchArea;
                (
                  node["amenity"="place_of_worship"](area.searchArea);
                  way["amenity"="place_of_worship"](area.searchArea);
                  node["building"~"^(church|chapel|cathedral|basilica|shrine)$"](area.searchArea);
                  way["building"~"^(church|chapel|cathedral|basilica|shrine)$"](area.searchArea);
                );
                out center tags;
                """;

            try
            {
                var areaResult = await ExecuteQueryAsync(areaIdQuery, ct);
                if (areaResult.Count > 0)
                {
                    _logger.LogInformation("Overpass retornou {Count} elementos via area(id) para '{Location}'.", areaResult.Count, locationName);
                    return areaResult;
                }
                _logger.LogWarning("area(id) retornou 0 resultados para '{Location}'. Tentando relation→map_to_area.", locationName);
            }
            catch (Exception ex) when (!ct.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "area(id) query falhou para '{Location}'. Tentando relation→map_to_area.", locationName);
            }
        }

        // ─── Nível 2: relation → map_to_area ────────────────────────────────────────
        var relQuery = $"""
            [out:json][timeout:90];
            (
              relation["name"~"^{locationName}$",i]["admin_level"~"^[6-9]$"]["boundary"="administrative"];
              relation["name"~"^{locationName}$",i]["place"~"^(city|town|municipality)$"];
            )->.rels;
            .rels map_to_area ->.searchArea;
            (
              node["amenity"="place_of_worship"](area.searchArea);
              way["amenity"="place_of_worship"](area.searchArea);
              node["building"~"^(church|chapel|cathedral|basilica|shrine)$"](area.searchArea);
              way["building"~"^(church|chapel|cathedral|basilica|shrine)$"](area.searchArea);
            );
            out center tags;
            """;

        var relResult = await ExecuteQueryAsync(relQuery, ct);

        // ─── Nível 3: area layer + nome ──────────────────────────────────────────────
        if (relResult.Count == 0)
        {
            _logger.LogWarning("relation→map_to_area sem resultados para '{Location}'. Tentando area layer.", locationName);
            var areaNameQuery = $"""
                [out:json][timeout:90];
                (
                  area["name"~"{locationName}",i]["admin_level"~"^[6-9]$"];
                  area["name"~"{locationName}",i]["place"~"^(city|town|municipality)$"];
                )->.searchArea;
                (
                  node["amenity"="place_of_worship"](area.searchArea);
                  way["amenity"="place_of_worship"](area.searchArea);
                  node["building"~"^(church|chapel|cathedral|basilica|shrine)$"](area.searchArea);
                  way["building"~"^(church|chapel|cathedral|basilica|shrine)$"](area.searchArea);
                );
                out center tags;
                """;
            relResult = await ExecuteQueryAsync(areaNameQuery, ct);
        }

        _logger.LogInformation("Overpass retornou {Count} elementos para '{Location}'.", relResult.Count, locationName);
        return relResult;
    }

    private async Task<List<ChurchElement>> ExecuteQueryAsync(string query, CancellationToken ct)
    {
        var encoded = Uri.EscapeDataString(query);
        bool allFailed = true;
        List<ChurchElement>? bestResult = null;

        // Tenta todos os mirrors em ordem. Para ao primeiro que retornar > 0 resultados.
        // Se um mirror retornar 0 resultados (HTTP 200 mas dados ausentes ou desatualizados),
        // tenta o próximo. Se todos retornarem 0, retorna [].
        // Só lança exceção se TODOS falharem por erros de rede/timeout/HTTP.
        foreach (var url in Mirrors)
        {
            if (ct.IsCancellationRequested) break;
            try
            {
                using var mirrorCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                mirrorCts.CancelAfter(TimeSpan.FromMinutes(3));

                _logger.LogInformation("Consultando Overpass mirror: {Url}", url);
                var response = await _http.GetAsync($"{url}?data={encoded}", mirrorCts.Token);

                // 429 = rate limited; espera e tenta o próximo mirror
                if ((int)response.StatusCode == 429)
                {
                    var wait = response.Headers.RetryAfter?.Delta ?? TimeSpan.FromSeconds(10);
                    _logger.LogWarning("Overpass {Url}: 429 rate limited — aguardando {Delay}s antes do próximo mirror", url, wait.TotalSeconds);
                    await Task.Delay(wait, ct);
                    continue;
                }

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Overpass {Url} retornou {Status} — tentando próximo mirror", url, response.StatusCode);
                    continue;
                }

                // Alguns mirrors retornam HTML de erro com HTTP 200 — detectar e ignorar
                var contentType = response.Content.Headers.ContentType?.MediaType ?? "";
                if (contentType.Contains("html"))
                {
                    _logger.LogWarning("Overpass {Url}: resposta HTML (servidor sobrecarregado) — tentando próximo mirror", url);
                    continue;
                }

                var json = await response.Content.ReadAsStringAsync(ct);

                // Overpass retorna HTTP 200 com remark quando sobrecarregado — tratar como falha
                if (json.Contains("\"remark\""))
                {
                    using var peek = JsonDocument.Parse(json);
                    if (peek.RootElement.TryGetProperty("remark", out var remark))
                    {
                        var msg = remark.GetString() ?? "";
                        if (msg.Contains("timeout") || msg.Contains("too busy") || msg.Contains("Dispatcher") || msg.Contains("error"))
                        {
                            _logger.LogWarning("Overpass {Url} remark de erro: {Msg} — tentando próximo mirror", url, msg);
                            continue;
                        }
                    }
                }

                allFailed = false;
                var elements = ParseElements(json);

                if (elements.Count > 0)
                {
                    _logger.LogInformation("Overpass {Url} retornou {Count} elementos", url, elements.Count);
                    return elements; // primeiro mirror com dados reais — retorna imediatamente
                }

                // Mirror respondeu mas com 0 resultados — pode ser dado desatualizado
                _logger.LogWarning("Overpass {Url}: 0 elementos — tentando próximo mirror para confirmar", url);
                bestResult ??= elements;
            }
            catch (OperationCanceledException) when (!ct.IsCancellationRequested)
            {
                _logger.LogWarning("Overpass {Url}: timeout de 3 min — tentando próximo mirror", url);
            }
            catch (Exception ex) when (!ct.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "Overpass {Url}: erro de rede — tentando próximo mirror", url);
            }
        }

        if (allFailed && bestResult is null)
            throw new InvalidOperationException("Todos os servidores Overpass estão indisponíveis ou com rate limit. Aguarde alguns minutos e tente novamente.");

        return bestResult ?? [];
    }

    private static List<ChurchElement> ParseElements(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var elements = doc.RootElement.GetProperty("elements");

        var result = new Dictionary<long, ChurchElement>();

        foreach (var el in elements.EnumerateArray())
        {
            var id   = el.GetProperty("id").GetInt64();
            var type = el.GetProperty("type").GetString() ?? "";

            double lat = 0, lon = 0;

            if (type == "node")
            {
                lat = el.GetProperty("lat").GetDouble();
                lon = el.GetProperty("lon").GetDouble();
            }
            else if (el.TryGetProperty("center", out var center))
            {
                lat = center.GetProperty("lat").GetDouble();
                lon = center.GetProperty("lon").GetDouble();
            }

            if (lat == 0 && lon == 0) continue;

            var tags = new Dictionary<string, string>();
            if (el.TryGetProperty("tags", out var tagsEl))
                foreach (var tag in tagsEl.EnumerateObject())
                    tags[tag.Name] = tag.Value.GetString() ?? "";

            result[id] = new ChurchElement
            {
                Id   = id,
                Type = type,
                Lat  = lat,
                Lon  = lon,
                Tags = tags
            };
        }

        return [.. result.Values];
    }
}
