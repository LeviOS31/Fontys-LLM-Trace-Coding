using Mediator;
using Shared;

namespace AssessmentCriteria.Contracts.Features.InternalDeleteAllAssessmentCriteriaOfProject;

public class InternalDeleteAllAssessmentCriteriaOfProjectRequest
    : IRequest<Result<InternalDeleteAllAssessmentCriteriaOfProjectResponse>>
{
    public Guid ProjectId { get; init; }
}
