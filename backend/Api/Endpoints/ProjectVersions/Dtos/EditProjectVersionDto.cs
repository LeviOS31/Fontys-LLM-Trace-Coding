namespace Api.Endpoints.ProjectVersions.Dtos;

public record EditProjectVersionDto
{
    public required string Name { get; init; }
    public required string Description { get; init; }
}
