using System;
using System.Collections.Generic;
using System.Text;

namespace Projects.Features.CreateProjectVersion
{
    public record CreateProjectVersionResponse
    {
        public required Guid VersionId { get; init; }
        public required Guid ProjectId { get; init; }
        public required string Name { get; init; }
        public required string Description { get; init; }
    }
}
