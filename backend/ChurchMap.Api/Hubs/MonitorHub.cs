using Microsoft.AspNetCore.SignalR;

namespace ChurchMap.Api.Hubs;

/// <summary>
/// SignalR hub para notificações em tempo real ao frontend Angular.
/// Eventos emitidos pelo MonitorWorker:
///   "DiffDetected"  → { location, newCount, closedCount }
///   "ScanStarted"   → { location }
///   "ScanCompleted" → { location, totalCount }
/// </summary>
public class MonitorHub : Hub
{
    // O hub apenas serve como endpoint de conexão.
    // Mensagens são enviadas via IHubContext<MonitorHub> pelos serviços.
}
