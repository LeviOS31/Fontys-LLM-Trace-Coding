using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;
using Traces.Contracts.Features.GetTracesCount;
using Traces.Data;

namespace Traces.Features.InternalGetTracesCount;

public class InternalGetTracesCountHandler : IRequestHandler<GetTracesCountQuery, Result<GetTracesCountResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<InternalGetTracesCountHandler>();
    private readonly TracesDbContext _tracesDbContext;

    public InternalGetTracesCountHandler(TracesDbContext tracesDbContext)
    {
        _tracesDbContext = tracesDbContext;
    }

    public async ValueTask<Result<GetTracesCountResponse>> Handle(
        GetTracesCountQuery query,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var totalCount = await _tracesDbContext
                .Traces.Where(t => t.TraceCollection.ProjectVersionId == query.ProjectVersionId)
                .CountAsync(cancellationToken);

            return new GetTracesCountResponse { TotalCount = totalCount };
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error retrieving traces count for project {ProjectId} version {ProjectVersionId}",
                query.ProjectId,
                query.ProjectVersionId
            );
            return ErrorCode.DatabaseError;
        }
    }
}
