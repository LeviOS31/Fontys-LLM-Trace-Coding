using Mediator;
using Shared;

namespace ProjectVersions.Contracts.Features.InternalGetProjectVersions;

public record InternalGetProjectVersionsQuery : IRequest<Result<InternalGetProjectVersionsResponse>>
{
    public required Guid ProjectId { get; init; }
}
