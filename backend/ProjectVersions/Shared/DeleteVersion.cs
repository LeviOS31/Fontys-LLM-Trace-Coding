using Mediator;
using Microsoft.EntityFrameworkCore;
using ProjectVersions.Data;
using ProjectVersions.Data.Models;
using Serilog;
using Shared;
using Traces.Contracts.Features.DeleteAllTracesOfVersion;

namespace ProjectVersions.Shared;

public class DeleteVersion
{
    private static readonly ILogger Logger = Log.ForContext<DeleteVersion>();
    private readonly ProjectVersionsDbContext _projectVersionsDbContext;
    private readonly IMediator _mediator;

    public DeleteVersion(ProjectVersionsDbContext projectVersionsDbContext, IMediator mediator)
    {
        _projectVersionsDbContext = projectVersionsDbContext;
        _mediator = mediator;
    }

    public async Task<Result<bool>> DeleteProjectVersion(ProjectVersion version, CancellationToken cancellationToken)
    {
        var deleteTracesRequest = new DeleteAllTracesOfVersionRequest { VersionId = version.VersionId };
        var result = await _mediator.Send(deleteTracesRequest, cancellationToken);

        if (result.IsError && result.ErrorCode != ErrorCode.NoChanges)
        {
            return result.ErrorCode;
        }

        var changes = await _projectVersionsDbContext
            .Versions.Where(x => x.VersionId == version.VersionId)
            .ExecuteDeleteAsync(cancellationToken);
        if (changes == 0)
        {
            Logger.Error(
                "Failed to delete project version {VersionId} for project {ProjectId}",
                version.VersionId,
                version.ProjectId
            );
            return ErrorCode.NoChanges;
        }

        return true;
    }
}
