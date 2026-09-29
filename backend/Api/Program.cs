using Api.Endpoints.AssessmentCriteria;
using Api.Endpoints.AxialCode;
using Api.Endpoints.JudgeTemplates;
using Api.Endpoints.Projects;
using Api.Endpoints.ProjectVersions;
using Api.Endpoints.Settings;
using Api.Endpoints.Statistics;
using Api.Endpoints.Traces;
using Api.Extensions;
using AssessmentCriteria.Extensions;
using AxialCodes.Extensions;
using JudgeTemplates.Extensions;
using Microsoft.AspNetCore.Http.Features;
using Projects.Extensions;
using ProjectVersions.Extensions;
using Serilog;
using Settings.Extensions;
using Shared.Extensions;
using Statistics.Extensions;
using Traces.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Configure max file size to 500MB
const long maxFileSize = 500 * 1024 * 1024;
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = maxFileSize;
});
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = maxFileSize;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMediator(options => options.ServiceLifetime = ServiceLifetime.Scoped);
builder.Services.AddSharedModule(builder.Configuration);
builder.Services.AddAssessmentCriteriaModule(builder.Configuration);
builder.Services.AddProjectsModule(builder.Configuration);
builder.Services.AddProjectVersionsModule(builder.Configuration);
builder.Services.AddTracesModule(builder.Configuration);
builder.Services.AddStatisticsModule(builder.Configuration);
builder.Services.AddAxialCodesModule(builder.Configuration);
builder.Services.AddSettingsModule(builder.Configuration);
builder.Services.AddJudgeTemplatesModule(builder.Configuration);

// Cors
var origins = builder.Configuration["Cors:AllowedOrigins"]?.Split(',');

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "Default",
        policy =>
        {
            policy.WithOrigins(origins!).AllowAnyHeader().AllowAnyMethod();
        }
    );
});

// Logging
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration) // optional but recommended
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

// Cors
app.UseCors("Default");

// Endpoints
app.MapAssessmentCriteriaEndpoints();
app.MapProjectsEndpoints();
app.MapProjectVersionsEndpoints();
app.MapSettingsEndpoints();
app.MapTracesEndpoint();
app.MapStatisticsEndpoint();
app.MapAxialCodeEndpoint();
app.MapJudgeTemplatesEndpoint();

await app.RunAsync();
