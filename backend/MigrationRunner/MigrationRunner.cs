using AssessmentCriteria.Data;
using AxialCodes.Data;
using JudgeTemplates.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Projects.Data;
using ProjectVersions.Data;
using Settings.Data;
using Traces.Data;

namespace MigrationRunner;

public class MigrationRunner
{
    private readonly ILogger<MigrationRunner> _logger;
    private readonly AssessmentCriteriaDbContext _assessmentCriteriaDbContext;
    private readonly ProjectDbContext _projectDb;
    private readonly ProjectVersionsDbContext _projectVersionsDb;
    private readonly TracesDbContext _tracesDb;
    private readonly AxialCodeDbContext _axialCodeDb;
    private readonly SettingsDbContext _settingsDb;
    private readonly JudgeTemplatesDbContext _judgeTemplatesDb;

    public MigrationRunner(
        ILogger<MigrationRunner> logger,
        AssessmentCriteriaDbContext assessmentCriteriaDbContext,
        ProjectDbContext projectDb,
        ProjectVersionsDbContext projectVersionsDb,
        TracesDbContext tracesDb,
        SettingsDbContext settingsDb,
        AxialCodeDbContext axialCodeDb,
        JudgeTemplatesDbContext judgeTemplatesDb
    )
    {
        _logger = logger;
        _assessmentCriteriaDbContext = assessmentCriteriaDbContext;
        _projectDb = projectDb;
        _projectVersionsDb = projectVersionsDb;
        _tracesDb = tracesDb;
        _axialCodeDb = axialCodeDb;
        _settingsDb = settingsDb;
        _judgeTemplatesDb = judgeTemplatesDb;
    }

    public async Task RunAsync()
    {
        _logger.LogInformation("Starting database migrations...");

        await MigrateWithRetry(_assessmentCriteriaDbContext, "AssessmentCriteria");
        await MigrateWithRetry(_projectDb, "Projects");
        await MigrateWithRetry(_projectVersionsDb, "ProjectVersions");
        await MigrateWithRetry(_tracesDb, "Traces");
        await MigrateWithRetry(_axialCodeDb, "Axialcode");
        await MigrateWithRetry(_settingsDb, "Settings");
        await MigrateWithRetry(_judgeTemplatesDb, "JudgeTemplates");

        _logger.LogInformation("All migrations completed!");
    }

    private async Task MigrateWithRetry(DbContext context, string name)
    {
        const int maxRetries = 5;

        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                _logger.LogInformation("Migrating {Name} (attempt {Attempt})...", name, attempt);

                await context.Database.MigrateAsync();

                _logger.LogInformation("✅ {Name} migrated successfully", name);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ {Name} migration failed: {ExceptionMessage}", name, ex.Message);

                if (attempt == maxRetries)
                    throw;

                await Task.Delay(3000);
            }
        }
    }
}
