namespace Statistics.Features.Shared;

public record AxialCodeReturnItem
{
    public required string Label { get; init; }
    public required string Description { get; init; }
    public required int OpenCodeCount { get; init; }
}
