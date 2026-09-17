using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using ProjectVersions.Contracts.Features.InternalGetProjectVersions;
using ProjectVersions.Data;
using ProjectVersions.Data.Models;
using Serilog;
using Shared;

namespace ProjectVersions.Features.InternalGetProjectVersions;

public class InternalGetProjectVersionsHandler
    : IRequestHandler<InternalGetProjectVersionsQuery, Result<InternalGetProjectVersionsResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<InternalGetProjectVersionsHandler>();
    private readonly ProjectVersionsDbContext _projectVersionsDbContext;

    public InternalGetProjectVersionsHandler(ProjectVersionsDbContext projectVersionsDbContext)
    {
        _projectVersionsDbContext = projectVersionsDbContext;
    }

    public async ValueTask<Result<InternalGetProjectVersionsResponse>> Handle(
        InternalGetProjectVersionsQuery query,
        CancellationToken cancellationToken
    )
    {
        List<ProjectVersion> projectVersions;

        try
        {
            projectVersions = await _projectVersionsDbContext
                .Versions.Where(x => x.ProjectId == query.ProjectId)
                .OrderBy(x => x.Name)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error retrieving versions for project {ProjectId}", query.ProjectId);
            return ErrorCode.DatabaseError;
        }

        return new InternalGetProjectVersionsResponse
        {
            Versions = projectVersions
                .Select(p => new InternalGetProjectVersionsResponse.ProjectVersionSummary
                {
                    VersionId = p.VersionId,
                    ProjectId = p.ProjectId,
                    Name = p.Name,
                    Description = p.Description,
                })
                .ToList(),
        };
    }
}
