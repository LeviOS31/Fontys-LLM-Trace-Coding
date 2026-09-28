namespace JudgeTemplates.Feature.GetJudgeTemplateVersions;

public record GetJudgeTemplateVersionsResponse
{
    public required IEnumerable<JudgeTemplateVersionViewModel> Versions { get; init; }

    public record JudgeTemplateVersionViewModel
    {
        public required int VersionNumber { get; init; }
        public required string Content { get; init; }
        public required DateTimeOffset CreatedAt { get; init; }
    }
}