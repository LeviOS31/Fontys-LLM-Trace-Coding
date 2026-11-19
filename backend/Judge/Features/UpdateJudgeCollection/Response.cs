namespace Judge.Features.UpdateJudgeCollection;

public sealed record UpdateJudgeCollectionResponse
{
    public required Guid JudgeCollectionId { get; init; }
    public required string Name { get; init; }
}