namespace Api.Endpoints.JudgeTemplates.Dtos;

public record UpdateJudgeTemplateDto
{
    public required string Content { get; init; }
}