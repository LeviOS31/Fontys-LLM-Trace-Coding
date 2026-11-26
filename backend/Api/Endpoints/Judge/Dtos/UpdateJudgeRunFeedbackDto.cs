namespace Api.Endpoints.Judge.Dtos;

public sealed record UpdateJudgeRunFeedbackDto
{
    public required string Feedback { get; init; }
}