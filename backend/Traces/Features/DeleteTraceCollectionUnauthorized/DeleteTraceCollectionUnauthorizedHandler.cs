using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;
using Traces.Data;

namespace Traces.Features.DeleteTraceCollectionUnauthorized;

public class DeleteTraceCollectionUnauthorizedHandler
    : IRequestHandler<DeleteTraceCollectionUnauthorizedRequest, Result<DeleteTraceCollectionUnauthorizedResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<DeleteTraceCollectionUnauthorizedHandler>();
    private readonly IMediator _mediator;
    private readonly TracesDbContext _tracesDbContext;

    public DeleteTraceCollectionUnauthorizedHandler(TracesDbContext tracesDbContext, IMediator mediator)
    {
        _mediator = mediator;
        _tracesDbContext = tracesDbContext;
    }

    public async ValueTask<Result<DeleteTraceCollectionUnauthorizedResponse>> Handle(
        DeleteTraceCollectionUnauthorizedRequest request,
        CancellationToken cancellationToken
    )
    {
        List<Guid> traceIds;
        try
        {
            traceIds = await _tracesDbContext
                .Traces.Where(x => x.TraceCollectionId == request.TraceCollectionId)
                .Select(x => x.TraceId)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Failed to fetch Traces with CollectionId {TraceCollectionId}", request.TraceCollectionId);
            return ErrorCode.DatabaseError;
        }

        int changes = 0;

        try
        {
            changes = await _tracesDbContext
                .TraceCollections.Where(x => x.TraceCollectionId == request.TraceCollectionId)
                .ExecuteDeleteAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Failed to Delete Traces with CollectionId {TraceCollectionId}",
                request.TraceCollectionId
            );
            return ErrorCode.DatabaseError;
        }

        if (changes > 0)
        {
            return new DeleteTraceCollectionUnauthorizedResponse();
        }

        return ErrorCode.NoChanges;
    }
}
