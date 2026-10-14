namespace Traces.Features.GetTraceCollectionTraces.Records;

public record TraceCollectionTraceItem
{
    public required Guid TraceId { get; init; }
    public required string Title { get; init; }
}