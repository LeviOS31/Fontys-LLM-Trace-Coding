namespace AxialCodes.Features.SaveAxialCodes;

public sealed record NegativeExampleUpdate
{
    public required Guid AxialCodeId { get; init; }
    public required string Trace { get; init; }
    public required string Reasoning { get; init; }
}
