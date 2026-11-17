namespace Api.Endpoints.Judge.Dtos;

/// <summary>Request body for renaming a judge collection.</summary>
public sealed record UpdateJudgeCollectionDto
{
    public required string Name { get; init; }
}