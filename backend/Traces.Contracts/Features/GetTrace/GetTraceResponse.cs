namespace Traces.Contracts.Features.GetTrace;

public record GetTraceResponse
{
    public required Guid TraceId { get; init; }
    public required Guid TraceCollectionId { get; init; }
    public required string CollectionName { get; init; }
    public required DateTime CollectionCreatedAt { get; init; }
    public Guid? TraceGroupId { get; init; }
    public required IReadOnlyList<TraceResourceView> TraceResources { get; init; }
    public required IReadOnlyList<TraceScopesView> TraceScopes { get; init; }
}
