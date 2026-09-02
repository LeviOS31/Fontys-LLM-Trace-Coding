namespace AxialCodes.Features.GenerateAxialCodingResult;

public record AxialCodeViewModel
{
    public required string Label { get; init; }
    public required string Description { get; init; }
    public required ICollection<Guid> TraceIds { get; init; }
}
