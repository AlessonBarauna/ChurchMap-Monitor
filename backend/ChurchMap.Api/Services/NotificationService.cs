using ChurchMap.Api.Data;
using ChurchMap.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ChurchMap.Api.Services;

/// <summary>Cria e gerencia registros de notificação de diff.</summary>
public class NotificationService
{
    private readonly AppDbContext _db;

    public NotificationService(AppDbContext db) => _db = db;

    /// <summary>Cria notificações para cada igreja nova/fechada no diff.</summary>
    public async Task CreateAsync(DiffResult diff, string locationKey, string? locationLabel = null)
    {
        var label = locationLabel ?? locationKey;

        foreach (var church in diff.NewChurches)
        {
            _db.Notifications.Add(new NotificationRecord
            {
                Type          = "new",
                ChurchOsmId   = church.Id,
                ChurchName    = church.Name,
                LocationKey   = locationKey,
                LocationLabel = label,
                Address       = BuildAddress(church)
            });
        }

        foreach (var church in diff.ClosedChurches)
        {
            _db.Notifications.Add(new NotificationRecord
            {
                Type          = "closed",
                ChurchOsmId   = church.Id,
                ChurchName    = church.Name,
                LocationKey   = locationKey,
                LocationLabel = label,
                Address       = BuildAddress(church)
            });
        }

        await _db.SaveChangesAsync();
    }

    public async Task<List<NotificationRecord>> GetAllAsync(string? type = null, bool? read = null)
    {
        var q = _db.Notifications.AsQueryable();
        if (type is not null)  q = q.Where(n => n.Type == type);
        if (read is not null)  q = q.Where(n => n.IsRead == read);
        return await q.OrderByDescending(n => n.CreatedAt).ToListAsync();
    }

    public async Task MarkAllReadAsync()
    {
        await _db.Notifications.Where(n => !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    public async Task DeleteAsync(int id)
    {
        var n = await _db.Notifications.FindAsync(id);
        if (n is not null) { _db.Notifications.Remove(n); await _db.SaveChangesAsync(); }
    }

    private static string? BuildAddress(ChurchElement church)
    {
        var parts = new[] { church.Street, church.HouseNumber, church.Suburb, church.City }
            .Where(p => !string.IsNullOrEmpty(p));
        var addr = string.Join(", ", parts);
        return string.IsNullOrEmpty(addr) ? null : addr;
    }
}
