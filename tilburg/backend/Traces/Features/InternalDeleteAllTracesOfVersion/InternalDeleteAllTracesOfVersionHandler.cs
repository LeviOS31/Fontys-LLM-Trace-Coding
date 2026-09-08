using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;
using Traces.Contracts.Features.DeleteAllTracesOfVersion;
using Traces.Data;
using Traces.Features.DeleteTraceCollectionUnauthorized;

namespace Traces.Features.InternalDeleteAllTracesOfVersion;

public class InternalDeleteAllTracesOfVersionHandler
    : IRequestHandler<DeleteAllTracesOfVersionRequest, Result<DeleteAllTracesOfVersionResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<InternalDeleteAllTracesOfVersionHandler>();
    private readonly TracesDbContext _tracesDbContext;
    private readonly IMediator _mediator;

    public InternalDeleteAllTracesOfVersionHandler(TracesDbContext tracesDbContext, IMediator mediator)
    {
        _tracesDbContext = tracesDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<DeleteAllTracesOfVersionResponse>> Handle(
        DeleteAllTracesOfVersionRequest request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var traceCollections = await _tracesDbContext
                .TraceCollections.Where(x => x.ProjectVersionId == request.VersionId)
                .ToListAsync(cancellationToken);

            if (traceCollections.Count == 0)
            {
                return ErrorCode.NoChanges;
            }

            foreach (var traceCollection in traceCollections)
            {
                var result = await _mediator.Send(
                    new DeleteTraceCollectionUnauthorizedRequest()
                    {
                        TraceCollectionId = traceCollection.TraceCollectionId,
                    },
                    cancellationToken
                );

                if (result.IsError)
                {
                    return result.ErrorCode;
                }
            }

            return new DeleteAllTracesOfVersionResponse();
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error deleting all traces for project version {VersionId}", request.VersionId);
            return ErrorCode.DatabaseError;
        }
    }
}
