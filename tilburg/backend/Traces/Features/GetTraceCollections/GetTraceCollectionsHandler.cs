using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;
using Traces.Data;
using Traces.Features.GetTraceCollections.Records;

namespace Traces.Features.GetTraceCollections;

public class GetTraceCollectionsHandler : IRequestHandler<GetTraceCollectionsQuery, Result<GetTraceCollectionsResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetTraceCollectionsHandler>();
    private readonly TracesDbContext _tracesDbContext;
    private readonly IMediator _mediator;

    public GetTraceCollectionsHandler(TracesDbContext tracesDbContext, IMediator mediator)
    {
        _tracesDbContext = tracesDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<GetTraceCollectionsResponse>> Handle(
        GetTraceCollectionsQuery request,
        CancellationToken cancellationToken
    )
    {
        List<TraceCollectionOverview> traceCollections;

        var getProjectQuery = new GetProjectQuery { ProjectId = request.ProjectId, UserId = request.UserId };
        var getProjectResult = await _mediator.Send(getProjectQuery, cancellationToken);

        if (!getProjectResult.IsSuccess) // Ownership test
        {
            Logger.Warning(
                "Failed to retrieve project {ProjectId} for user {UserId}. Error: {ErrorCode}",
                request.ProjectId,
                request.UserId,
                getProjectResult.ErrorCode
            );
            return getProjectResult.ErrorCode;
        }

        try
        {
            traceCollections = await _tracesDbContext
                .TraceCollections.Where(tc => tc.ProjectVersionId == request.VersionId)
                .Select(tc => new TraceCollectionOverview
                {
                    TraceCollectionId = tc.TraceCollectionId,
                    Name = tc.Name,
                    TracersCount = tc.Traces.Count,
                    CreatedAt = tc.CreatedAt,
                })
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error retrieving Trace Collections");
            return ErrorCode.DatabaseError;
        }

        return new GetTraceCollectionsResponse { TraceCollections = traceCollections };
    }
}
