using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;
using Traces.Data;
using Traces.Data.Models;
using Traces.Features.GetTraceCollectionTraces.Records;

namespace Traces.Features.GetTraceCollectionTraces;

public class GetTraceCollectionTracesHandler
    : IRequestHandler<GetTraceCollectionTracesQuery, Result<GetTraceCollectionTracesResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetTraceCollectionTracesHandler>();
    private readonly TracesDbContext _tracesDbContext;
    private readonly IMediator _mediator;

    public GetTraceCollectionTracesHandler(TracesDbContext tracesDbContext, IMediator mediator)
    {
        _tracesDbContext = tracesDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<GetTraceCollectionTracesResponse>> Handle(
        GetTraceCollectionTracesQuery query,
        CancellationToken cancellationToken
    )
    {
        var getProjectResult = await _mediator.Send(
            new GetProjectQuery { ProjectId = query.ProjectId, UserId = query.UserId },
            cancellationToken
        );

        if (!getProjectResult.IsSuccess)
        {
            Logger.Warning(
                "Failed to retrieve project {ProjectId} for user {UserId}. Error: {ErrorCode}",
                query.ProjectId,
                query.UserId,
                getProjectResult.ErrorCode
            );
            return getProjectResult.ErrorCode;
        }

        try
        {
            var traces = await _tracesDbContext.Traces
                .Where(trace =>
                    trace.TraceCollectionId == query.TraceCollectionId
                    && trace.TraceCollection.ProjectVersionId == query.ProjectVersionId
                )
                .Include(trace => trace.TraceScopes)
                    .ThenInclude(scope => scope.TraceScopeSpans)
                .ToListAsync(cancellationToken);

            var items = traces
                .Select(trace => new TraceCollectionTraceItem
                {
                    TraceId = trace.TraceId,
                    Title = GetTraceTitle(trace),
                })
                .ToList();

            return new GetTraceCollectionTracesResponse { Items = items };
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error retrieving traces for collection {TraceCollectionId}",
                query.TraceCollectionId
            );
            return ErrorCode.DatabaseError;
        }
    }

    /// <summary>
    /// Mirrors GetTraceGroupSummaryHandler's title derivation: the name of the
    /// root span (ParentSpanId == null) across the trace's scopes.
    /// </summary>
    private static string GetTraceTitle(Trace trace)
    {
        foreach (var scope in trace.TraceScopes)
        {
            var root = scope.TraceScopeSpans.FirstOrDefault(span => span.ParentSpanId == null);
            if (root is not null)
            {
                return root.Name;
            }
        }

        return string.Empty;
    }
}