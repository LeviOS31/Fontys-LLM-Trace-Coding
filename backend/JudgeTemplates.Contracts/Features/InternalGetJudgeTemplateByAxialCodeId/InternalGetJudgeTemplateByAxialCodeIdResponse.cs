namespace JudgeTemplates.Contracts.Features.InternalGetJudgeTemplateByAxialCodeId;

public record InternalGetJudgeTemplateByAxialCodeIdResponse
{
    public required JudgeTemplateViewModel[] JudgeTemplates { get; init; }
}

public record JudgeTemplateViewModel 
{
    public required Guid JudgeTemplateId { get; init; }
    public required string Content { get; init; }
    public required bool IsDeprecated { get; init; }
}