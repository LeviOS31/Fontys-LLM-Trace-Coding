namespace Judge.Features.ListJudgeRuns;

public record ListJudgeRunsResponse
{
    public required IEnumerable<JudgeRunSummaryViewModel> JudgeRuns { get; init; }
    public required JudgeRunTotalsViewModel Totals { get; init; }
}

public record JudgeRunSummaryViewModel
{
    public required Guid JudgeRunId { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required int TotalCount { get; init; }
    public required int TrueCount { get; init; }
    public required int FalseCount { get; init; }
    public required int FailedCount { get; init; }
}

// Aggregated over ALL runs of the version, not just the returned page.
public record JudgeRunTotalsViewModel
{
    public required int Runs { get; init; }
    public required int TotalCount { get; init; }
    public required int TrueCount { get; init; }
    public required int FalseCount { get; init; }
    public required int FailedCount { get; init; }
}