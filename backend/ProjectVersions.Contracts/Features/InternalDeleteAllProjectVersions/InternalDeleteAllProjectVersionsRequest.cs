using Mediator;
using Shared;

namespace ProjectVersions.Contracts.Features.InternalDeleteAllProjectVersions;

public record InternalDeleteAllProjectVersionsRequest : IRequest<Result<InternalDeleteAllProjectVersionsResponse>>
{
    public required Guid ProjectId { get; init; }
}
