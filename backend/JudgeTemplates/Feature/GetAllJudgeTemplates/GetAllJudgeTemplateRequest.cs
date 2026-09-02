using Mediator;
using Shared;

namespace JudgeTemplates.Feature.GetJudgeTemplates;

public class GetAllJudgeTemplateRequest : IRequest<Result<GetAllJudgeTemplateResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid UserId { get; init; }
}
