using Mediator;
using Shared;

namespace AssessmentCriteria.Contracts.Features.InternalGetAllAssessmentCriteriaOfProject;

public class InternalGetAllAssessmentCriteriaOfProjectQuery
    : IRequest<Result<InternalGetAllAssessmentCriteriaOfProjectResponse>>
{
    public Guid ProjectId { get; init; }
}
