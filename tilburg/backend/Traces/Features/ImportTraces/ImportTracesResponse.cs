using Traces.Data.Models;

namespace Traces.Features.ImportTraces;

public record ImportTracesResponse
{
    public required Guid TraceCollectionId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required string Name { get; init; }
    public required DateTime CreatedAt { get; init; }
}
