using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;
using Traces.Contracts.Features.GetVersionOpencode;
using Traces.Data;

namespace Traces.Features.GetVersionOpencode;

public class GetVersionOpencodeHandler : IRequestHandler<GetVersionOpencodeQuery, Result<GetVersionOpencodeResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetVersionOpencodeHandler>();
    private readonly TracesDbContext _tracesDbContext;
    private readonly IMediator _mediator;

    public GetVersionOpencodeHandler(TracesDbContext tracesDbContext, IMediator mediator)
    {
        _tracesDbContext = tracesDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<GetVersionOpencodeResponse>> Handle(
        GetVersionOpencodeQuery query,
        CancellationToken cancellationToken
    )
    {
        var getProjectQuery = new GetProjectQuery { ProjectId = query.ProjectId, UserId = query.UserId };
        var getProjectResult = await _mediator.Send(getProjectQuery, cancellationToken);

        if (!getProjectResult.IsSuccess)
        {
            return getProjectResult.ErrorCode;
        }

        var doesProjectContainVersion =
            getProjectResult.Value.Versions.Find(v => v.VersionId == query.ProjectVersionId) != null;
        if (!doesProjectContainVersion)
        {
            return ErrorCode.EntityNotFound;
        }

        IEnumerable<GetVersionOpencodeResponse.OpencodeViewModel> opencodes;
        try
        {
            opencodes = await _tracesDbContext
                .Traces.AsNoTracking()
                .Where(t => t.TraceCollection.ProjectVersionId == query.ProjectVersionId && t.OpenCode != null)
                .Select(t => new GetVersionOpencodeResponse.OpencodeViewModel
                {
                    TraceId = t.TraceId,
                    OpenCode = t.OpenCode!,
                })
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error retrieving traces for project version {ProjectVersionId}", query.ProjectVersionId);
            return ErrorCode.DatabaseError;
        }

        return new GetVersionOpencodeResponse { Opencodes = opencodes };
    }
}
