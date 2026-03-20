using System.Text.Json;
using ChurchMap.Api.Data;
using ChurchMap.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ChurchMap.Api.Services;

/// <summary>Persiste e recupera snapshots de varreduras.</summary>
public class SnapshotService
{
    private readonly AppDbContext _db;

    public SnapshotService(AppDbContext db) => _db = db;

    /// <summary>Retorna o snapshot mais recente de uma localidade.</summary>
    public async Task<Snapshot?> GetLatestAsync(string locationKey) =>
        await _db.Snapshots
            .Where(s => s.LocationKey == locationKey)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();

    /// <summary>Retorna todos os snapshots de uma localidade ordenados do mais recente.</summary>
    public async Task<List<Snapshot>> GetAllAsync(string locationKey) =>
        await _db.Snapshots
            .Where(s => s.LocationKey == locationKey)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

    /// <summary>Salva um novo snapshot com os elementos da varredura atual.</summary>
    public async Task<Snapshot> SaveAsync(string locationKey, List<ChurchElement> elements, string? label = null)
    {
        var snapshot = new Snapshot
        {
            LocationKey   = locationKey,
            LocationLabel = label ?? locationKey,
            TotalCount    = elements.Count,
            ElementsJson  = JsonSerializer.Serialize(elements)
        };

        _db.Snapshots.Add(snapshot);
        await _db.SaveChangesAsync();
        return snapshot;
    }

    public async Task DeleteAsync(int id)
    {
        var snap = await _db.Snapshots.FindAsync(id);
        if (snap is not null)
        {
            _db.Snapshots.Remove(snap);
            await _db.SaveChangesAsync();
        }
    }
}
