using ChurchMap.Api.Data;
using ChurchMap.Api.Hubs;
using ChurchMap.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite("Data Source=churchmap.db"));

// HTTP + Overpass — AddHttpClient já registra OverpassService como typed client (não duplicar com AddScoped)
builder.Services.AddHttpClient<OverpassService>(client =>
{
    client.Timeout = TimeSpan.FromMinutes(4);   // Overpass pode ser lento em cidades grandes
}).SetHandlerLifetime(TimeSpan.FromMinutes(10));

// Services (OverpassService é registrado pelo AddHttpClient acima; não adicionar aqui)

builder.Services.AddScoped<SnapshotService>();
builder.Services.AddScoped<DiffService>();
builder.Services.AddScoped<NotificationService>();

// Worker — registrado como Singleton para que o SettingsController possa injetá-lo
builder.Services.AddSingleton<MonitorWorker>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<MonitorWorker>());

// SignalR
builder.Services.AddSignalR();

// Controllers + OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// CORS para Angular dev
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:4200")
     .AllowAnyHeader()
     .AllowAnyMethod()
     .AllowCredentials()));

var app = builder.Build();

// Auto-migrate
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/openapi/v1.json", "ChurchMap API v1"));
}

app.UseCors();
app.MapControllers();
app.MapHub<MonitorHub>("/hubs/monitor");

app.Run();
