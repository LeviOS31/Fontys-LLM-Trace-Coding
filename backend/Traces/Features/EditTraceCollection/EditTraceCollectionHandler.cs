using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;
using Traces.Data;

namespace Traces.Features.EditTraceCollection;

public class EditTraceCollectionHandler
    : IRequestHandler<EditTraceCollectionRequest, Result<EditTraceCollectionResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<EditTraceCollectionHandler>();
    private readonly TracesDbContext _tracesDbContext;
    private readonly IMediator _mediator;

    public EditTraceCollectionHandler(TracesDbContext context, IMediator mediator)
    {
        _tracesDbContext = context;
        _mediator = mediator;
    }

    public async ValueTask<Result<EditTraceCollectionResponse>> Handle(
        EditTraceCollectionRequest request,
        CancellationToken cancellationToken
    )
    {
        var getProjectQuery = new GetProjectQuery { ProjectId = request.ProjectId, UserId = request.UserId };

        var getProjectResult = await _mediator.Send(getProjectQuery, cancellationToken);

        if (!getProjectResult.IsSuccess)
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
            var traceCollection = await _tracesDbContext.TraceCollections.FirstOrDefaultAsync(
                tc => tc.TraceCollectionId == request.TraceCollectionId,
                cancellationToken
            );

            if (traceCollection is null)
            {
                return ErrorCode.EntityNotFound;
            }

            if (getProjectResult.Value.Versions.All(v => v.VersionId != traceCollection.ProjectVersionId))
            {
                Logger.Warning(
                    "Trace Collection {TraceCollectionId} does not belong to any version of project {ProjectId}",
                    request.TraceCollectionId,
                    request.ProjectId
                );
                return ErrorCode.Unauthorized;
            }

            traceCollection.Name = request.Name;

            await _tracesDbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error editing Trace Collection");
            return ErrorCode.DatabaseError;
        }
        return new EditTraceCollectionResponse();
    }
}
