using ChurchMap.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ChurchMap.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly NotificationService _notifications;

    public NotificationsController(NotificationService notifications) => _notifications = notifications;

    /// <summary>Lista notificações com filtros opcionais por tipo e status de leitura.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? type, [FromQuery] bool? read)
    {
        var list = await _notifications.GetAllAsync(type, read);
        return Ok(list);
    }

    /// <summary>Marca todas as notificações como lidas.</summary>
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _notifications.MarkAllReadAsync();
        return NoContent();
    }

    /// <summary>Remove uma notificação pelo ID.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _notifications.DeleteAsync(id);
        return NoContent();
    }
}
