namespace Api.Endpoints.ProjectVersions.Dtos;

public record CreateProjectVersionDto
{
    public required string Name { get; init; }
    public required string Description { get; init; }
}
