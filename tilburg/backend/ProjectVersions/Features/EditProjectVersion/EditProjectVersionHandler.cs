using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using ProjectVersions.Data;
using ProjectVersions.Data.Models;
using Serilog;
using Shared;

namespace ProjectVersions.Features.EditProjectVersion;

public class EditProjectVersionHandler : IRequestHandler<EditProjectVersionRequest, Result<EditProjectVersionResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<EditProjectVersionHandler>();
    private readonly ProjectVersionsDbContext _projectVersionsDbContext;
    private readonly IMediator _mediator;

    public EditProjectVersionHandler(ProjectVersionsDbContext projectVersionsDbContext, IMediator mediator)
    {
        _projectVersionsDbContext = projectVersionsDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<EditProjectVersionResponse>> Handle(
        EditProjectVersionRequest request,
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

        ProjectVersion? projectVersion;
        try
        {
            projectVersion = await _projectVersionsDbContext.Versions.FirstOrDefaultAsync(
                v => v.ProjectId == request.ProjectId && v.VersionId == request.VersionId,
                cancellationToken
            );
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error retrieving version {VersionId} for project {ProjectId}",
                request.VersionId,
                request.ProjectId
            );
            return ErrorCode.DatabaseError;
        }

        if (projectVersion is null)
        {
            Logger.Warning(
                "Project version {VersionId} for project {ProjectId} was not found",
                request.VersionId,
                request.ProjectId
            );
            return ErrorCode.EntityNotFound;
        }

        bool projectVersionNameAlreadyExists;
        try
        {
            projectVersionNameAlreadyExists = await _projectVersionsDbContext
                .Versions.Where(v =>
                    v.ProjectId == request.ProjectId
                    && v.VersionId != request.VersionId
                    && v.Name.Trim().ToLower().Equals(request.Name.Trim().ToLower())
                )
                .AnyAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error checking duplicate names for version {VersionId} in project {ProjectId}",
                request.VersionId,
                request.ProjectId
            );
            return ErrorCode.DatabaseError;
        }

        if (projectVersionNameAlreadyExists)
        {
            Logger.Warning(
                "A project version with the name '{VersionName}' already exists for project {ProjectId}. User: {UserId}",
                request.Name,
                request.ProjectId,
                request.UserId
            );
            return ErrorCode.ProjectVersionNameAlreadyExists;
        }

        projectVersion.Name = request.Name;
        projectVersion.Description = request.Description;

        try
        {
            await _projectVersionsDbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error updating version {VersionId} for project {ProjectId}",
                request.VersionId,
                request.ProjectId
            );
            return ErrorCode.DatabaseError;
        }

        return new EditProjectVersionResponse
        {
            VersionId = projectVersion.VersionId,
            ProjectId = projectVersion.ProjectId,
            Name = projectVersion.Name,
            Description = projectVersion.Description,
        };
    }
}
