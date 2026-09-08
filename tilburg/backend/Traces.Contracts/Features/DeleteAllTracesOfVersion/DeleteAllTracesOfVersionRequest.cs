using Mediator;
using Shared;

namespace Traces.Contracts.Features.DeleteAllTracesOfVersion;

public class DeleteAllTracesOfVersionRequest : IRequest<Result<DeleteAllTracesOfVersionResponse>>
{
    public Guid VersionId { get; set; }
}
