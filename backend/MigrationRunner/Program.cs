using AssessmentCriteria.Data;
using AxialCodes.Data;
using JudgeTemplates.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Projects.Data;
using ProjectVersions.Data;
using Settings.Data;
using Traces.Data;

var builder = Host.CreateApplicationBuilder(args);

string connectionString =
    builder.Configuration["ConnectionStrings:Default"]
    ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");

Console.WriteLine("Connection string: '" + connectionString + "'");

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddDbContext<AssessmentCriteriaDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddDbContext<ProjectDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddDbContext<ProjectVersionsDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddDbContext<TracesDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddDbContext<AxialCodeDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddDbContext<SettingsDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddDbContext<JudgeTemplatesDbContext>(options => options.UseNpgsql(connectionString));

// Migration runner
builder.Services.AddScoped<MigrationRunner.MigrationRunner>();

var app = builder.Build();

using var scope = app.Services.CreateScope();
var runner = scope.ServiceProvider.GetRequiredService<MigrationRunner.MigrationRunner>();

await runner.RunAsync();

Console.WriteLine("All migrations completed!");
