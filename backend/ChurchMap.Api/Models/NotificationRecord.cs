namespace ChurchMap.Api.Models;

/// <summary>Registro de notificação gerado ao detectar diff entre snapshots.</summary>
public class NotificationRecord
{
    public int Id { get; set; }
    public string Type { get; set; } = "";       // "new" | "closed"
    public long ChurchOsmId { get; set; }
    public string ChurchName { get; set; } = "";
    public string LocationKey { get; set; } = "";
    public string LocationLabel { get; set; } = "";
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
}
