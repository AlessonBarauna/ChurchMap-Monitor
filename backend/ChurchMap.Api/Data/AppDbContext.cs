using ChurchMap.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ChurchMap.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Snapshot>           Snapshots     => Set<Snapshot>();
    public DbSet<NotificationRecord> Notifications => Set<NotificationRecord>();
    public DbSet<MonitorSettings>    Settings      => Set<MonitorSettings>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<MonitorSettings>().HasData(new MonitorSettings { Id = 1 });
    }
}
