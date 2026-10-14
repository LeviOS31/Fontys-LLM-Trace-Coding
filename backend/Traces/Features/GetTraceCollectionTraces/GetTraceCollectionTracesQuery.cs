using Mediator;
using Shared;
using Traces.Features.GetTraceCollectionTraces.Records;

namespace Traces.Features.GetTraceCollectionTraces;

public record GetTraceCollectionTracesQuery : IRequest<Result<GetTraceCollectionTracesResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid UserId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid TraceCollectionId { get; init; }
}

public record GetTraceCollectionTracesResponse
{
    public required IReadOnlyList<TraceCollectionTraceItem> Items { get; init; }
}