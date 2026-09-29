using Mediator;
using Shared;

namespace JudgeTemplates.Feature.GetJudgeTemplateVersions;

public class GetJudgeTemplateVersionsRequest : IRequest<Result<GetJudgeTemplateVersionsResponse>>
{
    public required Guid UserId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid JudgeTemplateId { get; init; }
}