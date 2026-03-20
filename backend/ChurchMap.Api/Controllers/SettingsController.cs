using System.Text.Json;
using ChurchMap.Api.Data;
using ChurchMap.Api.Hubs;
using ChurchMap.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ChurchMap.Api.Controllers;

public record UpdateSettingsDto(
    bool IsEnabled,
    int IntervalMinutes,
    List<string> WatchedLocations);

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext        _db;
    private readonly MonitorWorker       _worker;
    private readonly OverpassService     _overpass;
    private readonly SnapshotService     _snapshots;
    private readonly DiffService         _diff;
    private readonly NotificationService _notifications;
    private readonly IHubContext<MonitorHub> _hub;

    public SettingsController(
        AppDbContext db,
        MonitorWorker worker,
        OverpassService overpass,
        SnapshotService snapshots,
        DiffService diff,
        NotificationService notifications,
        IHubContext<MonitorHub> hub)
    {
        _db            = db;
        _worker        = worker;
        _overpass      = overpass;
        _snapshots     = snapshots;
        _diff          = diff;
        _notifications = notifications;
        _hub           = hub;
    }

    /// <summary>Retorna configurações atuais do monitor.</summary>
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var s = await _db.Settings.FirstAsync();
        return Ok(new
        {
            s.IsEnabled,
            s.IntervalMinutes,
            watchedLocations = JsonSerializer.Deserialize<List<string>>(s.WatchedLocationsJson) ?? []
        });
    }

    /// <summary>Atualiza configurações do monitor.</summary>
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateSettingsDto dto)
    {
        var s = await _db.Settings.FirstAsync();
        s.IsEnabled            = dto.IsEnabled;
        s.IntervalMinutes      = dto.IntervalMinutes;
        s.WatchedLocationsJson = JsonSerializer.Serialize(dto.WatchedLocations);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Dispara varredura manual imediata para todas as localizações monitoradas.</summary>
    [HttpPost("scan-now")]
    public async Task<IActionResult> ScanNow(CancellationToken ct)
    {
        var s = await _db.Settings.FirstAsync(ct);
        var locations = JsonSerializer.Deserialize<List<string>>(s.WatchedLocationsJson) ?? [];

        if (locations.Count == 0)
            return BadRequest(new { error = "Nenhuma localização monitorada configurada." });

        // Executa varredura em background para não bloquear a resposta
        _ = Task.Run(async () =>
        {
            foreach (var loc in locations)
                await _worker.ScanLocationAsync(loc, _overpass, _snapshots, _diff, _notifications, CancellationToken.None);
        }, ct);

        return Accepted(new { message = $"Varredura iniciada para {locations.Count} localização(ões)." });
    }
}
