using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using ProjectVersions.Data;
using ProjectVersions.Data.Models;
using Serilog;
using Shared;

namespace ProjectVersions.Features.CreateProjectVersion;

public class CreateProjectVersionHandler
    : IRequestHandler<CreateProjectVersionRequest, Result<CreateProjectVersionResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<CreateProjectVersionHandler>();
    private readonly ProjectVersionsDbContext _projectVersionsDbContext;
    private readonly IMediator _mediator;

    public CreateProjectVersionHandler(ProjectVersionsDbContext projectVersionsDbContext, IMediator mediator)
    {
        _projectVersionsDbContext = projectVersionsDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<CreateProjectVersionResponse>> Handle(
        CreateProjectVersionRequest request,
        CancellationToken cancellationToken
    )
    {
        var getProjectQuery = new GetProjectQuery { ProjectId = request.ProjectId, UserId = request.UserId };
        var getProjectResult = await _mediator.Send(getProjectQuery, cancellationToken);

        if (!getProjectResult.IsSuccess)
        {
            Logger.Warning(
                "Failed to retrieve project {ProjectId} for user {UserId}. Error: {ErrorCode}",
                request.ProjectId,
                request.UserId,
                getProjectResult.ErrorCode
            );
            return getProjectResult.ErrorCode;
        }

        var existingProjectVersionWithSameName = await _projectVersionsDbContext
            .Versions.Where(v =>
                v.ProjectId == request.ProjectId && v.Name.Trim().ToLower().Equals(request.Name.Trim().ToLower())
            )
            .AnyAsync(cancellationToken);

        if (existingProjectVersionWithSameName)
        {
            Logger.Warning(
                "A project version with the name '{VersionName}' already exists for project {ProjectId}. User: {UserId}",
                request.Name,
                request.ProjectId,
                request.UserId
            );
            return ErrorCode.ProjectVersionNameAlreadyExists;
        }

        return await CreateProjectVersion(request, getProjectResult.Value, cancellationToken);
    }

    private async ValueTask<Result<CreateProjectVersionResponse>> CreateProjectVersion(
        CreateProjectVersionRequest request,
        GetProjectResponse project,
        CancellationToken cancellationToken
    )
    {
        var projectVersion = new ProjectVersion
        {
            VersionId = Guid.NewGuid(),
            ProjectId = project.ProjectId,
            Name = request.Name,
            Description = request.Description,
        };

        int changes;
        try
        {
            _projectVersionsDbContext.Versions.Add(projectVersion);
            changes = await _projectVersionsDbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error saving changes");
            return ErrorCode.DatabaseError;
        }

        if (changes > 0)
        {
            return new CreateProjectVersionResponse
            {
                VersionId = projectVersion.VersionId,
                ProjectId = projectVersion.ProjectId,
                Name = projectVersion.Name,
                Description = projectVersion.Description,
            };
        }

        return ErrorCode.NoChanges;
    }
}
