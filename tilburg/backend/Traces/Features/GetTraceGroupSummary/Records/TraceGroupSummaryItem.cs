namespace Traces.Features.GetTraceSummaries.Records;

public record TraceGroupSummaryItem
{
    public required Guid TraceGroupId { get; init; }
    public required string GroupTitle { get; init; }
    public required string CollectionName { get; init; }
    public required DateTime CollectionCreatedAt { get; init; }
    public required int TraceCount { get; init; }
    public required int AmountOfSpans { get; init; }
    public required int AmountOfOpenCodes { get; init; }
    public required int AmountOfAxialCodes { get; init; }
    public required bool NeedsAxialCodeUpdate { get; init; }
}
