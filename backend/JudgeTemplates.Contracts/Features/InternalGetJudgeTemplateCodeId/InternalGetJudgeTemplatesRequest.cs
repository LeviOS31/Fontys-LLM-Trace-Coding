using Mediator;
using Shared;

namespace JudgeTemplates.Contracts.Features.InternalGetJudgeTemplates;

public record InternalGetJudgeTemplatesRequest : IRequest<Result<InternalGetJudgeTemplatesResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public List<Guid>? judgeIds { get; init; }
    public required Guid UserId { get; init; }
}