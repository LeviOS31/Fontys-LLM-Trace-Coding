namespace AxialCodes.Features.GenerateAxialCodingResult;

public record AxialCodeViewModel
{
    public required string Label { get; init; }
    public required string Description { get; init; }
    public required ICollection<Guid> TraceIds { get; init; }
    public string? JudgeGuidelines { get; init; }
    public IEnumerable<OpenCodeJustificationViewModel>? OpenCodeJustifications { get; init; }
}

public record OpenCodeJustificationViewModel
{
    public required Guid TraceId { get; init; }
    public required string Quote { get; init; }
    public required string Justification { get; init; }
}
