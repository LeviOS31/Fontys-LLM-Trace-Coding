using Traces.Contracts.Features.GetTrace;
using Traces.Enums;

namespace Traces.Features.GetTraceGroup;

public record GetTraceGroupResponse
{
    public required Guid TraceGroupId { get; init; }
    public required string TraceGroupType { get; init; }
    public required IReadOnlyList<TraceDetailView> Traces { get; init; }
}

public record TraceDetailView
{
    public required Guid TraceId { get; init; }
    public required Guid TraceCollectionId { get; init; }
    public required string CollectionName { get; init; }
    public required DateTime CollectionCreatedAt { get; init; }
    public required IReadOnlyList<TraceResourceView> TraceResources { get; init; }
    public required IReadOnlyList<TraceScopesView> TraceScopes { get; init; }
    public string? OpenCode { get; init; }
    public required DateTime UpdatedAt { get; init; }
}
