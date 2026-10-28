using System.Text.Json;
using Judge.Data;
using Judge.Features.JudgeTracesForAxialCode;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace Judge.Features.GetJudgeRun;

public class GetJudgeRunHandler : IRequestHandler<GetJudgeRunRequest, Result<GetJudgeRunResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetJudgeRunHandler>();

    private readonly JudgeDbContext _dbContext;

    public GetJudgeRunHandler(JudgeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async ValueTask<Result<GetJudgeRunResponse>> Handle(
        GetJudgeRunRequest request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var run = await _dbContext
                .JudgeRuns.AsNoTracking()
                .Where(r =>
                    r.JudgeRunId == request.JudgeRunId
                    && r.ProjectId == request.ProjectId
                    && r.ProjectVersionId == request.ProjectVersionId
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