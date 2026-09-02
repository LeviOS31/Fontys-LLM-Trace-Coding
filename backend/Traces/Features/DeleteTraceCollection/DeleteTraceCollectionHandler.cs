using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;
using Traces.Data;
using Traces.Data.Models;
using Traces.Features.DeleteTraceCollectionUnauthorized;

namespace Traces.Features.DeleteTraceCollection;

public class DeleteTraceCollectionHandler
    : IRequestHandler<DeleteTraceCollectionRequest, Result<DeleteTraceCollectionResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<DeleteTraceCollectionHandler>();
    private readonly IMediator _mediator;
    private readonly TracesDbContext _tracesDbContext;

    public DeleteTraceCollectionHandler(TracesDbContext tracesDbContext, IMediator mediator)
    {
        _mediator = mediator;
        _tracesDbContext = tracesDbContext;
    }

    public async ValueTask<Result<DeleteTraceCollectionResponse>> Handle(
        DeleteTraceCollectionRequest request,
        CancellationToken cancellationToken
    )
    {
        // Ownership test
        var resultGetProject = await _mediator.Send(
            new Projects.Contracts.Features.GetProject.GetProjectQuery
            {
                ProjectId = request.ProjectId,
                UserId = request.UserId,
            },
            cancellationToken
        );

        if (resultGetProject.IsError)
        {
            Logger.Warning(
                "Failed to retrieve project {ProjectId} for user {UserId}. Error: {ErrorCode}",
                request.ProjectId,
                request.UserId,
                resultGetProject.ErrorCode
            );
            return resultGetProject.ErrorCode;
        }

        TraceCollection? traceCollection;
        try
        {
            traceCollection = await _tracesDbContext.TraceCollections.FirstOrDefaultAsync(
                tc => tc.TraceCollectionId == request.TraceCollectionId,
                cancellationToken
            );
            if (traceCollection == null)
            {
                Logger.Warning("Trace Collection {TraceCollectionId} not found", request.TraceCollectionId);
                return ErrorCode.EntityNotFound;
            }
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Failed to fetch Trace Collection {TraceCollectionId}", request.TraceCollectionId);
            return ErrorCode.DatabaseError;
        }

        var result = await _mediator.Send(
            new DeleteTraceCollectionUnauthorizedRequest() { TraceCollectionId = request.TraceCollectionId },
            cancellationToken
        );

        if (result.IsError)
        {
            Logger.Error(
                "Failed to delete Trace Collection {TraceCollectionId}. Error: {ErrorCode}",
                request.TraceCollectionId,
                result.ErrorCode
            );
            return result.ErrorCode;
        }
        return new DeleteTraceCollectionResponse();
    }
}
