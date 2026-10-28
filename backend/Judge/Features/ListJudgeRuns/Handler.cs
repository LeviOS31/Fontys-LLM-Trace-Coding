using Judge.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace Judge.Features.ListJudgeRuns;

public class ListJudgeRunsHandler : IRequestHandler<ListJudgeRunsRequest, Result<ListJudgeRunsResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<ListJudgeRunsHandler>();

    private readonly JudgeDbContext _dbContext;

    public ListJudgeRunsHandler(JudgeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async ValueTask<Result<ListJudgeRunsResponse>> Handle(
        ListJudgeRunsRequest request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var query = _dbContext
                .JudgeRuns.AsNoTracking()
                .Where(r => r.ProjectId == request.ProjectId && r.ProjectVersionId == request.ProjectVersionId);

            var totals = await query
                .GroupBy(_ => 1)
                .Select(g => new JudgeRunTotalsViewModel
                {
                    Runs = g.Count(),
                    TotalCount = g.Sum(r => r.TotalCount),
                    TrueCount = g.Sum(r => r.TrueCount),
                    FalseCount = g.Sum(r => r.FalseCount),
                    FailedCount = g.Sum(r => r.FailedCount),
                })
                .FirstOrDefaultAsync(cancellationToken);

            // Projection: ResultsJson is never read from the database here.
            var runs = await query
                .OrderByDescending(r => r.CreatedAt)
                .ThenByDescending(r => r.JudgeRunId)
                .Skip(request.Offset)
                .Take(request.Limit)
                .Select(r => new JudgeRunSummaryViewModel
                {
                    JudgeRunId = r.JudgeRunId,
                    CreatedAt = r.CreatedAt,
                    TotalCount = r.TotalCount,
                    TrueCount = r.TrueCount,
                    FalseCount = r.FalseCount,
                    FailedCount = r.FailedCount,
                })
                .ToListAsync(cancellationToken);

            return new ListJudgeRunsResponse
            {
                JudgeRuns = runs,
                Totals = totals ?? new JudgeRunTotalsViewModel
                {
                    Runs = 0,
                    TotalCount = 0,
                    TrueCount = 0,
                    FalseCount = 0,
                    FailedCount = 0,
                },
            };
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "Error listing judge runs for version {ProjectVersionId}", request.ProjectVersionId);
            return ErrorCode.DatabaseError;
        }
    }
}