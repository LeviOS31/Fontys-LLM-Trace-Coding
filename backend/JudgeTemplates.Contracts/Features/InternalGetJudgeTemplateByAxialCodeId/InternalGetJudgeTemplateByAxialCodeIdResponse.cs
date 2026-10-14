namespace JudgeTemplates.Contracts.Features.InternalGetJudgeTemplateByAxialCodeId;

public record InternalGetJudgeTemplateByAxialCodeIdResponse
{
    public required Guid JudgeTemplateId { get; init; }
    public required string Content { get; init; }
    public required bool IsDeprecated { get; init; }
}