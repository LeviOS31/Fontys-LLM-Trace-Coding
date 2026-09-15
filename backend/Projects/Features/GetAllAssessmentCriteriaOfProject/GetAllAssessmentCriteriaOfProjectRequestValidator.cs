using Projects.Contracts.Features.GetAllAssessmentCriteriaOfProject;
using FluentValidation;

namespace Projects.Features.GetAllAssessmentCriteriaOfProject
{
    public class GetAllAssessmentCriteriaOfProjectRequestValidator: AbstractValidator<GetAllAssessmentCriteriaOfProjectQuery>
    {
        public GetAllAssessmentCriteriaOfProjectRequestValidator()
        {
            RuleFor(x => x.ProjectId).NotEmpty();
        }
    }
}
