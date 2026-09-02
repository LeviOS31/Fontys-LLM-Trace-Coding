using Traces.Features.GetTraceCollections.Records;

namespace Traces.Features.GetTraceCollections;

public record GetTraceCollectionsResponse
{
    public required IEnumerable<TraceCollectionOverview> TraceCollections { get; init; }
}
