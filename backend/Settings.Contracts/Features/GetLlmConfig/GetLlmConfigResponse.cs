namespace Settings.Contracts.Features.GetLlmConfig;

public record GetLlmConfigResponse
{
    public required string? ProviderName { get; init; }
    public required Uri? Endpoint { get; init; }
    public required string? ModelName { get; init; }
}
