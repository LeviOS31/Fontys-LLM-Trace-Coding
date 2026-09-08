namespace Settings.Features.GetLlmStatus;

public record GetLlmStatusResponse
{
    public required string? ProviderName { get; init; }
    public required Uri? Endpoint { get; init; }
    public required string? ModelName { get; init; }
    public required bool IsConnected { get; init; }
}
