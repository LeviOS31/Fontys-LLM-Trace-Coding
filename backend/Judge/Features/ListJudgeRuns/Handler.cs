using System.Text.Json;
using Judge.Data;
using Judge.Features.JudgeTracesForAxialCode;
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
                .Where(r => r.JudgeCollectionId == request.JudgeCollectionId);

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

            var runData = await query
                .OrderByDescending(r => r.CreatedAt)
                .ThenByDescending(r => r.JudgeRunId)
                .Skip(request.Offset)
                .Take(request.Limit)
                .Select(r => new
                {
                    JudgeRunId = r.JudgeRunId,
                    r.ResultsJson,
                    CreatedAt = r.CreatedAt,
                    TotalCount = r.TotalCount,
                    TrueCount = r.TrueCount,
                    FalseCount = r.FalseCount,
                    FailedCount = r.FailedCount,
                })
                .ToListAsync(cancellationToken);

            var runs = runData.Select(r => new JudgeRunSummaryViewModel
            {
                JudgeRunId = r.JudgeRunId,
                JudgeTemplateId = GetJudgeTemplateId(r.ResultsJson),
                CreatedAt = r.CreatedAt,
                TotalCount = r.TotalCount,
                TrueCount = r.TrueCount,
                FalseCount = r.FalseCount,
                FailedCount = r.FailedCount,
            }).ToList();

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
            Logger.Error(ex, "Error listing judge runs for collection {JudgeCollectionId}", request.JudgeCollectionId);
            return ErrorCode.DatabaseError;
        }
    }

    private static Guid? GetJudgeTemplateId(string resultsJson)
    {
        using var document = JsonDocument.Parse(resultsJson);
        var results = document.RootElement;
        if (results.ValueKind != JsonValueKind.Array)
        {
            throw new JsonException("Judge run results must be an array.");
        }

        if (results.GetArrayLength() == 0)
        {
            return null;
        }

        // Every trace in a run uses the same template, so the first result identifies it.
        var firstResult = results[0];
        if (
            !firstResult.TryGetProperty(nameof(TraceJudgeResultViewModel.JudgeTemplateId), out var id)
            && !firstResult.TryGetProperty("judgeTemplateId", out id)
        )
        {
            throw new JsonException("Judge run results do not contain a judge template ID.");
        }

        return id.GetGuid();
    }
}