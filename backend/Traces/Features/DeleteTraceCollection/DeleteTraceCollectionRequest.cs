using Mediator;
using Projects.Contracts.Features.GetProject;
using Shared;

namespace Traces.Features.DeleteTraceCollection;

public record DeleteTraceCollectionRequest : IRequest<Result<DeleteTraceCollectionResponse>>
{
    public required Guid TraceCollectionId { get; set; }
    public required Guid ProjectId { get; set; }
    public required Guid UserId { get; set; }
}
