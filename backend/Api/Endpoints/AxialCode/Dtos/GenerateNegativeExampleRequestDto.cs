namespace Api.Endpoints.AxialCode.Dtos;

public sealed record GenerateNegativeExampleRequestDto
{
    public required string Label { get; init; }
    public required string Description { get; init; }
    public required string JudgeGuidelines { get; init; }
    public string? PositiveExampleTrace { get; init; }
}
