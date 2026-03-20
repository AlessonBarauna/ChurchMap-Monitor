using ChurchMap.Api.Hubs;
using ChurchMap.Api.Models.DTOs;
using ChurchMap.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace ChurchMap.Api.Controllers;

[ApiController]
[Route("api/churches")]
public class ChurchesController : ControllerBase
{
    private readonly OverpassService     _overpass;
    private readonly SnapshotService     _snapshots;
    private readonly DiffService         _diff;
    private readonly NotificationService _notifications;
    private readonly IHubContext<MonitorHub> _hub;

    public ChurchesController(
        OverpassService overpass,
        SnapshotService snapshots,
        DiffService diff,
        NotificationService notifications,
        IHubContext<MonitorHub> hub)
    {
        _overpass      = overpass;
        _snapshots     = snapshots;
        _diff          = diff;
        _notifications = notifications;
        _hub           = hub;
    }

    /// <summary>Busca igrejas na Overpass API, salva snapshot e retorna diff.</summary>
    [HttpPost("search")]
    public async Task<IActionResult> Search([FromBody] SearchRequestDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Location))
            return BadRequest("Location is required.");

        try
        {
            var elements = await _overpass.SearchAsync(dto.Location, ct);
            var prev     = await _snapshots.GetLatestAsync(dto.Location);

            DiffResultDto? diffDto = null;
            if (prev is not null)
            {
                var diffResult = _diff.Compare(prev, elements);
                diffDto = new DiffResultDto(diffResult.NewChurches, diffResult.ClosedChurches);

                if (diffResult.NewChurches.Count > 0 || diffResult.ClosedChurches.Count > 0)
                {
                    await _notifications.CreateAsync(diffResult, dto.Location);
                    await _hub.Clients.All.SendAsync("DiffDetected", new
                    {
                        location    = dto.Location,
                        newCount    = diffResult.NewChurches.Count,
                        closedCount = diffResult.ClosedChurches.Count
                    }, ct);
                }
            }

            var snapshot = await _snapshots.SaveAsync(dto.Location, elements, dto.Location);

            return Ok(new
            {
                snapshot = new SnapshotDto(
                    snapshot.Id,
                    snapshot.LocationKey,
                    snapshot.LocationLabel,
                    snapshot.CreatedAt,
                    snapshot.TotalCount),
                elements,
                diff = diffDto
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(503, new { error = ex.Message });
        }
    }
}
