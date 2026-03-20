namespace ChurchMap.Api.Models;

/// <summary>Configurações globais do monitor (singleton, Id=1).</summary>
public class MonitorSettings
{
    public int Id { get; set; } = 1;
    public bool IsEnabled { get; set; } = false;
    public int IntervalMinutes { get; set; } = 360;
    public string WatchedLocationsJson { get; set; } = "[]";
}
