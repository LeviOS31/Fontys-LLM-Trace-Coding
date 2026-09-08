using System;
using System.Collections.Generic;

namespace Projects.Features.GetAllProjects;

public record GetAllProjectsResponse
{
    public required List<ProjectSummary> Projects { get; init; }

    public record ProjectSummary
    {
        public required Guid ProjectId { get; init; }
        public required string Name { get; init; }
        public required string Description { get; init; }
    }
}
