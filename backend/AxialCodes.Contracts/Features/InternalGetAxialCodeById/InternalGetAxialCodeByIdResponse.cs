using AxialCodes.Contracts.Features.GetAxialCodes;

namespace AxialCodes.Contracts.Features.InternalGetAxialCodeById;

public record InternalGetAxialCodeByIdResponse
{
    public required Guid AxialCodeId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required string Label { get; init; }
    public required string Description { get; init; }
    public required ICollection<Guid> TraceIds { get; init; }
    public string? InclusionCriteria { get; init; }
    public IEnumerable<TraceJustificationViewModel> TraceJustifications { get; init; } = [];
}
