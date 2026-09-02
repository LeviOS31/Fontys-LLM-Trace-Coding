namespace Traces.Contracts.Features.GetTracesCount;

public record GetTracesCountResponse
{
    public required int TotalCount { get; init; }
}
