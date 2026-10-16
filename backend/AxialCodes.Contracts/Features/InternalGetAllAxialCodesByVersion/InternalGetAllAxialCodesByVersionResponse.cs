namespace AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;

public record InternalGetAllAxialCodesByVersionResponse
{
    public required IEnumerable<AxialCodeEntry> AxialCodes { get; init; }

    public record AxialCodeEntry
    {
        public required Guid AxialCodeId { get; init; }
        public required string Label { get; init; }
        public required string Description { get; init; }
        public required bool IsActive { get; init; }
        public required ICollection<Guid> TraceIds { get; init; }

        // Null for axial codes generated before judge guidelines existed.
        public string? JudgeGuidelines { get; init; }
    }
}
