using Mediator;
using Shared;

namespace Traces.Contracts.Features.GetVersionOpencode;

public record GetVersionOpencodeQuery : IRequest<Result<GetVersionOpencodeResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid UserId { get; init; }
}
