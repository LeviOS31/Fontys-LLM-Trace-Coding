using Mediator;
using Shared;

namespace Traces.Contracts.Features.GetTracesCount;

public record GetTracesCountQuery : IRequest<Result<GetTracesCountResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
}
