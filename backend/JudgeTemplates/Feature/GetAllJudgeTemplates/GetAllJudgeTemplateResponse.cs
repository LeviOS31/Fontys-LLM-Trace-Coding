namespace JudgeTemplates.Feature.GetJudgeTemplates;

public record GetAllJudgeTemplateResponse
{
    public required IEnumerable<JudgeTemplateViewModel> JudgeTemplates { get; init; }

    public record JudgeTemplateViewModel
    {
        public required Guid Id { get; init; }
        public required string Name { get; init; }
        public required string Description { get; init; }
        public required string Template { get; init; }
        public required bool IsDeprecated { get; init; }
    }
}
