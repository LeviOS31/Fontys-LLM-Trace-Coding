using Mediator;
using Shared;

namespace JudgeTemplates.Contracts.Features.SetAllJudgeTemplatesToDeprecated;

public class SetAllJudgeTemplatesToDeprecatedRequest : IRequest<Result<SetAllJudgeTemplatesToDeprecatedResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
}
