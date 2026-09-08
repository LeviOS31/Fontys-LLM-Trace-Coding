using Mediator;
using Shared;

namespace Projects.Contracts.Features.GetProject;

public record GetProjectQuery : IRequest<Result<GetProjectResponse>>
{
    public Guid UserId { get; init; }

    public Guid ProjectId { get; init; }
}
