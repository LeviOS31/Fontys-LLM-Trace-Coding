namespace AxialCodes.Contracts.Features.GetAxialCodes;

public record AxialCodeViewModel
{
    public required Guid AxialCodeId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required string Label { get; init; }
    public required string Description { get; init; }
    public required ICollection<Guid> TraceIds { get; init; }
    public string? InclusionCriteria { get; init; }
    public IEnumerable<TraceJustificationViewModel> TraceJustifications { get; init; } = [];
}

public record TraceJustificationViewModel
{
    public required Guid TraceId { get; init; }
    public required string Quote { get; init; }
    public required string Justification { get; init; }
}
