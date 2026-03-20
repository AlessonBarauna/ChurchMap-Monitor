using System.Text.Json;
using ChurchMap.Api.Data;
using ChurchMap.Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ChurchMap.Api.Services;

/// <summary>Worker em background que varre localizações monitoradas periodicamente.</summary>
public class MonitorWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<MonitorHub> _hub;
    private readonly ILogger<MonitorWorker> _logger;

    public MonitorWorker(
        IServiceScopeFactory scopeFactory,
        IHubContext<MonitorHub> hub,
        ILogger<MonitorWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _hub          = hub;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MonitorWorker iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunCycleAsync(stoppingToken);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado no ciclo do MonitorWorker.");
            }
        }

        _logger.LogInformation("MonitorWorker encerrado.");
    }

    private async Task RunCycleAsync(CancellationToken ct)
    {
        using var scope       = _scopeFactory.CreateScope();
        var db                = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var overpass          = scope.ServiceProvider.GetRequiredService<OverpassService>();
        var snapService       = scope.ServiceProvider.GetRequiredService<SnapshotService>();
        var diffService       = scope.ServiceProvider.GetRequiredService<DiffService>();
        var notifService      = scope.ServiceProvider.GetRequiredService<NotificationService>();

        var settings = await db.Settings.FirstAsync(ct);

        if (!settings.IsEnabled)
        {
            await Task.Delay(TimeSpan.FromMinutes(1), ct);
            return;
        }

        var locations = JsonSerializer.Deserialize<List<string>>(settings.WatchedLocationsJson) ?? [];

        foreach (var loc in locations)
        {
            if (ct.IsCancellationRequested) break;
            await ScanLocationAsync(loc, overpass, snapService, diffService, notifService, ct);
            await Task.Delay(TimeSpan.FromSeconds(5), ct);
        }

        await Task.Delay(TimeSpan.FromMinutes(settings.IntervalMinutes), ct);
    }

    internal async Task ScanLocationAsync(
        string location,
        OverpassService overpass,
        SnapshotService snapService,
        DiffService diffService,
        NotificationService notifService,
        CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Varrendo {Location}...", location);
            await _hub.Clients.All.SendAsync("ScanStarted", new { location }, ct);

            var elements = await overpass.SearchAsync(location, ct);
            var prev     = await snapService.GetLatestAsync(location);

            if (prev is not null)
            {
                var diff = diffService.Compare(prev, elements);
                if (diff.NewChurches.Count > 0 || diff.ClosedChurches.Count > 0)
                {
                    await notifService.CreateAsync(diff, location);
                    await _hub.Clients.All.SendAsync("DiffDetected", new
                    {
                        location,
                        newCount    = diff.NewChurches.Count,
                        closedCount = diff.ClosedChurches.Count
                    }, ct);
                }
            }

            await snapService.SaveAsync(location, elements, location);
            await _hub.Clients.All.SendAsync("ScanCompleted", new { location, totalCount = elements.Count }, ct);
            _logger.LogInformation("Varredura de {Location} concluída: {Count} igrejas.", location, elements.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao varrer {Location}", location);
        }
    }
}
