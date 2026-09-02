namespace Api.Endpoints.Projects.Dtos;

public record CreateProjectDto
{
    public required string Name { get; init; }
    public required string Description { get; init; }
}
