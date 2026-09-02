using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;
using Traces.Data;
using Traces.Data.Models;

namespace Traces.Features.EditOpenCode;

public class EditOpenCodeHandler : IRequestHandler<EditOpencodeRequest, Result<EditOpencodeResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<EditOpenCodeHandler>();
    private readonly TracesDbContext _tracesDbContext;
    private readonly IMediator _mediator;

    public EditOpenCodeHandler(TracesDbContext dbContext, IMediator mediator)
    {
        _tracesDbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<EditOpencodeResponse>> Handle(
        EditOpencodeRequest request,
        CancellationToken cancellationToken
    )
    {
        var getProjectQuery = new GetProjectQuery() { ProjectId = request.ProjectId, UserId = request.UserId };
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

        var doesProjectContainVersion =
            getProjectResult.Value.Versions.Find(v => v.VersionId == request.ProjectVersionId) != null;
        if (!doesProjectContainVersion)
        {
            return ErrorCode.EntityNotFound;
        }

        Trace? trace;
        try
        {
            trace = await _tracesDbContext
                .Traces.Include(t => t.TraceCollection)
                .FirstOrDefaultAsync(
                    t => t.TraceId == request.TraceId && t.TraceCollection.ProjectVersionId == request.ProjectVersionId,
                    cancellationToken
                );
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Failed to fetch trace with TraceId: {TraceId}", request.TraceId);
            return ErrorCode.DatabaseError;
        }

        int changes;

        if (trace is null)
        {
            Logger.Error("Trace with  TraceId: {TraceId} returned not found", request.TraceId);
            return ErrorCode.EntityNotFound;
        }

        trace.OpenCode = string.IsNullOrWhiteSpace(request.OpenCode) ? null : request.OpenCode.Trim();
        trace.UpdatedAt = DateTime.UtcNow;
        try
        {
            changes = await _tracesDbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "Error saving open code");
            return ErrorCode.DatabaseError;
        }

        if (changes > 0)
        {
            return new EditOpencodeResponse();
        }
        return ErrorCode.NoChanges;
    }
}
