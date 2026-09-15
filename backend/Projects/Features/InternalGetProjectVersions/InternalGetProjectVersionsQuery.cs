using Mediator;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace Projects.Features.InternalGetProjectVersions
{
    public record InternalGetProjectVersionsQuery: IRequest<Result<InternalGetProjectVersionsResponse>>
    {
        public required Guid ProjectId { get; init; }
    }
}
