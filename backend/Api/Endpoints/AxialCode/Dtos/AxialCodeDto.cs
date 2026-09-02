namespace Api.Endpoints.AxialCode.Dtos;

public record AxialCodeDto
{
    public required string Label { get; init; }
    public required string Description { get; init; }
    public required ICollection<Guid> TraceIds { get; init; }
}
