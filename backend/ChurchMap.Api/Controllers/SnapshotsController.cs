using ChurchMap.Api.Models.DTOs;
using ChurchMap.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ChurchMap.Api.Controllers;

[ApiController]
[Route("api/snapshots")]
public class SnapshotsController : ControllerBase
{
    private readonly SnapshotService _snapshots;

    public SnapshotsController(SnapshotService snapshots) => _snapshots = snapshots;

    /// <summary>Retorna histórico de snapshots de uma localidade.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string location)
    {
        var list = await _snapshots.GetAllAsync(location);
        return Ok(list.Select(s => new SnapshotDto(s.Id, s.LocationKey, s.LocationLabel, s.CreatedAt, s.TotalCount)));
    }

    /// <summary>Retorna o snapshot mais recente de uma localidade.</summary>
    [HttpGet("latest")]
    public async Task<IActionResult> GetLatest([FromQuery] string location)
    {
        var s = await _snapshots.GetLatestAsync(location);
        if (s is null) return NotFound();
        return Ok(new SnapshotDto(s.Id, s.LocationKey, s.LocationLabel, s.CreatedAt, s.TotalCount));
    }

    /// <summary>Remove um snapshot pelo ID.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _snapshots.DeleteAsync(id);
        return NoContent();
    }
}
