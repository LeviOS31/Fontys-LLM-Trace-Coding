using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;
using Traces.Contracts.Features.InternalGetTraceTranscripts;
using Traces.Data;
using Traces.Data.Models;

namespace Traces.Features.InternalGetTraceTranscripts;

public partial class InternalGetTraceTranscriptsHandler
    : IRequestHandler<
        InternalGetTraceTranscriptsRequest,
        Result<InternalGetTraceTranscriptsResponse>
    >
{
    private static readonly ILogger Logger =
        Log.ForContext<InternalGetTraceTranscriptsHandler>();

    private readonly TracesDbContext _dbContext;

    public InternalGetTraceTranscriptsHandler(TracesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async ValueTask<Result<InternalGetTraceTranscriptsResponse>> Handle(
        InternalGetTraceTranscriptsRequest request,
        CancellationToken cancellationToken
    )
    {
        List<Trace> traces;

        try
        {
            var tracesQuery = _dbContext.Traces
                .Where(t =>
                    t.TraceCollection.ProjectVersionId
                    == request.ProjectVersionId
                );

            if (request.TraceCollectionId.HasValue)
            {
                tracesQuery = tracesQuery.Where(t =>
                    t.TraceCollectionId
                    == request.TraceCollectionId.Value
                );
            }

            if (request.TraceId.HasValue)
            {
                tracesQuery = tracesQuery.Where(t =>
                    t.TraceId == request.TraceId.Value
                );
            }

            traces = await tracesQuery
                .Include(t => t.TraceScopes)
                    .ThenInclude(s => s.TraceScopeSpans)
                        .ThenInclude(span => span.SpanAttributes)
                .ToListAsync(cancellationToken);
        }
        catch (
            Exception ex
        ) when (
            ex is DbUpdateException
            or DbException
            or InvalidOperationException
        )
        {
            Logger.Error(
                ex,
                "Error retrieving trace transcripts for version {ProjectVersionId}",
                request.ProjectVersionId
            );

            return ErrorCode.DatabaseError;
        }

        var transcripts = traces.Select(trace =>
            new TraceTranscriptViewModel
            {
                TraceId = trace.TraceId,
                Transcript = SharedTraceFunctions.BuildTranscript(trace),
            }
        );

        return new InternalGetTraceTranscriptsResponse
        {
            Transcripts = transcripts
        };
    }

}