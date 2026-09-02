using System;

namespace Projects.Features.CreateProject;

public record CreateProjectResponse
{
    public required Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
}
