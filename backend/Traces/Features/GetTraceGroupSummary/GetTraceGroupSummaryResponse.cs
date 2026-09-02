using Traces.Features.GetTraceSummaries.Records;

namespace Traces.Features.GetTraceSummaries;

public record GetTraceGroupSummaryResponse
{
    public required IReadOnlyList<TraceGroupSummaryItem> Items { get; init; }
    public required int TotalCount { get; init; }
    public required int Page { get; init; }
    public required int PageSize { get; init; }
    public required bool HasNextPage { get; init; }
}
