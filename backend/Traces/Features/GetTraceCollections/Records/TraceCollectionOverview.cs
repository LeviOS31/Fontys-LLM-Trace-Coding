namespace Traces.Features.GetTraceCollections.Records;

public class TraceCollectionOverview
{
    public required Guid TraceCollectionId { get; init; }
    public required string Name { get; init; }
    public required int TracersCount { get; init; }
    public required DateTime CreatedAt { get; init; }
}
