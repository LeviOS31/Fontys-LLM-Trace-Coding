namespace Api.Endpoints.Traces.Dtos;

public record ImportTracesDto
{
    public required string Name { get; init; }
    public required IFormFile File { get; init; }
}
