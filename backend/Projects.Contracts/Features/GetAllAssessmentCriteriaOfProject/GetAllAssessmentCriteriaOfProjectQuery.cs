using Mediator;
using Shared;

namespace Projects.Contracts.Features.GetAllAssessmentCriteriaOfProject
{
    public class GetAllAssessmentCriteriaOfProjectQuery: IRequest<Result<GetAllAssessmentCriteriaOfProjectResponse>>
    {
        public Guid ProjectId { get; init; }
    }
}
