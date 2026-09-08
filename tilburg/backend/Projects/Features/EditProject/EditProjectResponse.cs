using System;

namespace Projects.Features.EditProject;

public record EditProjectResponse
{
    public required Guid ProjectId { get; init; }
    public required Guid UserId { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
}
