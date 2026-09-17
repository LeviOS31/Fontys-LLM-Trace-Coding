using Mediator;
using System;
using System.Collections.Generic;
using System.Text;

namespace Projects.Contracts.Features.GetAllProjectVersions
{
    public record GetALLProjectVersionsQuery: IRequest<GetAllProjectVersionsResponse>
    {
        public required Guid ProjectId { get; init; }
    }
}
