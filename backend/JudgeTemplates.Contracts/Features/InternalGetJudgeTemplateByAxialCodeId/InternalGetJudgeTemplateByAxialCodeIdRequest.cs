using Mediator;
using Shared;

namespace JudgeTemplates.Contracts.Features.InternalGetJudgeTemplateByAxialCodeId;

public record InternalGetJudgeTemplateByAxialCodeIdRequest : IRequest<Result<InternalGetJudgeTemplateByAxialCodeIdResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid AxialCodeId { get; init; }
    public required Guid UserId { get; init; }
}