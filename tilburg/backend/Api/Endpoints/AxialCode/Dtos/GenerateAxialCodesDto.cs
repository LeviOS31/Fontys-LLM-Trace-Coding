namespace Api.Endpoints.AxialCode.Dtos;

public record GenerateAxialCodesDto
{
    public required string? Feedback { get; init; }
    public required IEnumerable<AxialCodeDto>? AxialCodes { get; init; }
}
