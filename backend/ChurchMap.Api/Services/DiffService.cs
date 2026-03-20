using ChurchMap.Api.Models;

namespace ChurchMap.Api.Services;

public class DiffResult
{
    public List<ChurchElement> NewChurches    { get; set; } = [];
    public List<ChurchElement> ClosedChurches { get; set; } = [];
}

/// <summary>Compara dois snapshots e retorna igrejas adicionadas/removidas.</summary>
public class DiffService
{
    public DiffResult Compare(Snapshot previous, List<ChurchElement> current)
    {
        var prevIds = previous.GetElements().Select(e => e.Id).ToHashSet();
        var currIds = current.Select(e => e.Id).ToHashSet();

        return new DiffResult
        {
            NewChurches    = current.Where(e => !prevIds.Contains(e.Id)).ToList(),
            ClosedChurches = previous.GetElements().Where(e => !currIds.Contains(e.Id)).ToList()
        };
    }
}
