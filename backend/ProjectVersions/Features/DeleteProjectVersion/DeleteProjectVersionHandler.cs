using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using ProjectVersions.Data;
using ProjectVersions.Data.Models;
using ProjectVersions.Shared;
using Serilog;
using Shared;

namespace ProjectVersions.Features.DeleteProjectVersion;

public class DeleteProjectVersionHandler
    : IRequestHandler<DeleteProjectVersionRequest, Result<DeleteProjectVersionResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<DeleteProjectVersionHandler>();
    private readonly ProjectVersionsDbContext _projectVersionsDbContext;
    private readonly IMediator _mediator;
    private readonly DeleteVersion _deleteVersion;

    public DeleteProjectVersionHandler(
        ProjectVersionsDbContext projectVersionsDbContext,
        IMediator mediator,
        DeleteVersion deleteVersion
    )
    {
        _projectVersionsDbContext = projectVersionsDbContext;
        _mediator = mediator;
        _deleteVersion = deleteVersion;
    }

    public async ValueTask<Result<DeleteProjectVersionResponse>> Handle(
        DeleteProjectVersionRequest request,
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

        ProjectVersion? version;
        try
        {
            version = await _projectVersionsDbContext
                .Versions.Where(v => v.ProjectId == request.ProjectId && v.VersionId == request.VersionId)
                .SingleOrDefaultAsync(cancellationToken);

            if (version is null)
            {
                return ErrorCode.EntityNotFound;
            }
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error checking if version {VersionId} for project {ProjectId} exists: {ErrorMessage}",
                request.VersionId,
                request.ProjectId,
                ex.Message
            );
            return ErrorCode.DatabaseError;
        }

        var result = await _deleteVersion.DeleteProjectVersion(version, cancellationToken);
        return result.IsError ? result.ErrorCode : new DeleteProjectVersionResponse();
    }
}
