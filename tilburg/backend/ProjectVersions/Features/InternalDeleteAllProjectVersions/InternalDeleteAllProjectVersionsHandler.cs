using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using ProjectVersions.Contracts.Features.InternalDeleteAllProjectVersions;
using ProjectVersions.Data;
using ProjectVersions.Shared;
using Serilog;
using Shared;

namespace ProjectVersions.Features.InternalDeleteAllProjectVersions;

public class InternalDeleteAllProjectVersionsHandler
    : IRequestHandler<InternalDeleteAllProjectVersionsRequest, Result<InternalDeleteAllProjectVersionsResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<InternalDeleteAllProjectVersionsHandler>();
    private readonly ProjectVersionsDbContext _projectVersionsDbContext;
    private readonly DeleteVersion _deleteVersion;

    public InternalDeleteAllProjectVersionsHandler(
        ProjectVersionsDbContext projectVersionsDbContext,
        DeleteVersion deleteVersion
    )
    {
        _projectVersionsDbContext = projectVersionsDbContext;
        _deleteVersion = deleteVersion;
    }

    public async ValueTask<Result<InternalDeleteAllProjectVersionsResponse>> Handle(
        InternalDeleteAllProjectVersionsRequest request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var versions = await _projectVersionsDbContext
                .Versions.Where(x => x.ProjectId == request.ProjectId)
                .ToListAsync(cancellationToken);

            if (versions.Count == 0)
            {
                return ErrorCode.NoChanges;
            }

            foreach (var version in versions)
            {
                var result = await _deleteVersion.DeleteProjectVersion(version, cancellationToken);

                if (result.IsError)
                {
                    return result.ErrorCode;
                }
            }

            return new InternalDeleteAllProjectVersionsResponse();
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error deleting all versions for project {ProjectId}", request.ProjectId);
            return ErrorCode.DatabaseError;
        }
    }
}
