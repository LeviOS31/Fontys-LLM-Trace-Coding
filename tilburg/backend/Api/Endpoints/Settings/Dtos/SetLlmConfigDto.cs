namespace Api.Endpoints.Settings.Dtos;

public record SetLlmConfigDto
{
    public required string? ProviderName { get; init; }
    public required Uri? Endpoint { get; init; }
    public required string? ModelName { get; init; }
}
