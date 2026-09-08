namespace AxialCodes.Features.GenerateAxialCodingResult;

public record GenerateAxialCodingResultResponse
{
    public required Guid AxialCodingResultId { get; init; }
    public IEnumerable<AxialCodeViewModel>? AxialCodes { get; init; }
}
