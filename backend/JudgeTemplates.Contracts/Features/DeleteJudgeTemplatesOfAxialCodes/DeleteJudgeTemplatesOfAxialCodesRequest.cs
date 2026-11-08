using Mediator;
using Shared;

namespace JudgeTemplates.Contracts.Features.DeleteJudgeTemplatesOfAxialCodes;

public record DeleteJudgeTemplatesOfAxialCodesRequest : IRequest<Result<DeleteJudgeTemplatesOfAxialCodesResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required ICollection<Guid> AxialCodeIds { get; init; }
}
