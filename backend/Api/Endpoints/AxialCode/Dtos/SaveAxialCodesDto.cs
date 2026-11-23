namespace Api.Endpoints.AxialCode.Dtos;

public sealed record SaveAxialCodesDto
{
    public required IEnumerable<AxialCodeNegativeExampleDto> NegativeExamples { get; init; }
}

public sealed record AxialCodeNegativeExampleDto
{
    public required Guid AxialCodeId { get; init; }
    public required string Trace { get; init; }
    public required string Reasoning { get; init; }
}
