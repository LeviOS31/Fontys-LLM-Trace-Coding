namespace Settings.Features.SetLlmConfig;

public record SetLlmConfigResponse
{
    public required string? ProviderName { get; init; }
    public required Uri? Endpoint { get; init; }
    public required string? ModelName { get; init; }
}
