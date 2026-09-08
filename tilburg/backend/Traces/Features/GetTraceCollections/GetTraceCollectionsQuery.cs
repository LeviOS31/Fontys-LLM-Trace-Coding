using Mediator;
using Shared;

namespace Traces.Features.GetTraceCollections;

public record GetTraceCollectionsQuery : IRequest<Result<GetTraceCollectionsResponse>>
{
    public required Guid VersionId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid UserId { get; init; }
}
