using Mediator;
using Shared;

namespace Projects.Contracts.Features.GetAllProjectVersions
{
    public record GetAllProjectVersionsQuery: IRequest<Result<GetAllProjectVersionsResponse>>
    {
        public required Guid ProjectId { get; init; }
    }
}
