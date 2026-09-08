namespace Settings.Features.GetDefaultLlmConfig;

public record GetDefaultLlmConfigResponse
{
    public required string ProviderName { get; init; }
    public required Uri Endpoint { get; init; }
    public required string ModelName { get; init; }
}
