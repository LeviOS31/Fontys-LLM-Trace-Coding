using Judge.Data;
using Judge.Features.JudgeTracesForAxialCode;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetAllProjectVersions;
using Serilog;
using Shared;
using System.Text.Json;

namespace Judge.Features.GetJudgeRun;

public class GetJudgeRunHandler : IRequestHandler<GetJudgeRunRequest, Result<GetJudgeRunResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetJudgeRunHandler>();

    private readonly JudgeDbContext _dbContext;
    private readonly IMediator _mediator;

    public GetJudgeRunHandler(JudgeDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<GetJudgeRunResponse>> Handle(
        GetJudgeRunRequest request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var judgecollection = await _dbContext.JudgeCollections.
                Where(j => j.JudgeCollectionId == request.JudgeCollectionId && j.ProjectVersionId == request.ProjectVersionId).
                FirstOrDefaultAsync(
                    cancellationToken
                );
            if (judgecollection is null)
            {
                return ErrorCode.EntityNotFound;
            }
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "Error loading judge run {JudgeRunId}", request.JudgeRunId);
            return ErrorCode.DatabaseError;
        }


        var getAllVersionRequest = new GetAllProjectVersionsQuery
        {
            ProjectId = request.ProjectId,
        };

        var getAllVersionResult = await _mediator.Send(getAllVersionRequest, cancellationToken);

        if (!getAllVersionResult.IsSuccess)
        {
            return getAllVersionResult.ErrorCode;
        }

        if (!getAllVersionResult.Value.Versions.Any(v => v.VersionId == request.ProjectVersionId))
        {
            return ErrorCode.EntityNotFound;
        }

        try
        {
            var run = await _dbContext
                .JudgeRuns.AsNoTracking()
                .Where(r =>
                    r.JudgeRunId == request.JudgeRunId
                )
                .Select(r => new { r.JudgeRunId, r.ResultsJson })
                .FirstOrDefaultAsync(cancellationToken);
            if (run is null)
            {
                return ErrorCode.EntityNotFound;
            }

            var results = JsonSerializer.Deserialize<List<TraceJudgeResultViewModel>>(run.ResultsJson) ?? [];
            return new GetJudgeRunResponse { JudgeRunId = run.JudgeRunId, Results = results };
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "Error loading judge run {JudgeRunId}", request.JudgeRunId);
            return ErrorCode.DatabaseError;
        }
    }
}