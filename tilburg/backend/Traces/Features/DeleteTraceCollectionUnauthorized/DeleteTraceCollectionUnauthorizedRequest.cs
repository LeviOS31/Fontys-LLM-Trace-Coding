using Mediator;
using Shared;

namespace Traces.Features.DeleteTraceCollectionUnauthorized;

public class DeleteTraceCollectionUnauthorizedRequest : IRequest<Result<DeleteTraceCollectionUnauthorizedResponse>>
{
    public required Guid TraceCollectionId { get; set; }
}
