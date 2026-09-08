using Mediator;
using Shared;

namespace Traces.Contracts.Features.GetTrace;

public record GetTraceQuery : IRequest<Result<GetTraceResponse>>
{
    public Guid ProjectId { get; init; }
    public Guid UserId { get; init; }
    public required Guid TraceId { get; init; }
    public required Guid ProjectVersionId { get; init; }
}
