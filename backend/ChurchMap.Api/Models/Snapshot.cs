using System.Text.Json;
using ChurchMap.Api.Services;

namespace ChurchMap.Api.Models;

/// <summary>Registro de uma varredura salva no banco.</summary>
public class Snapshot
{
    public int Id { get; set; }
    public string LocationKey { get; set; } = "";
    public string LocationLabel { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int TotalCount { get; set; }
    public string ElementsJson { get; set; } = "[]";

    public List<ChurchElement> GetElements() =>
        JsonSerializer.Deserialize<List<ChurchElement>>(ElementsJson) ?? [];
}
