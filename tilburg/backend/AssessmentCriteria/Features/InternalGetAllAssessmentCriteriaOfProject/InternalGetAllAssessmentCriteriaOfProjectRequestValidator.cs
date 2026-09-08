using AssessmentCriteria.Contracts.Features.InternalGetAllAssessmentCriteriaOfProject;
using FluentValidation;

namespace AssessmentCriteria.Features.InternalGetAllAssessmentCriteriaOfProject;

public class InternalGetAllAssessmentCriteriaOfProjectRequestValidator
    : AbstractValidator<InternalGetAllAssessmentCriteriaOfProjectQuery>
{
    public InternalGetAllAssessmentCriteriaOfProjectRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
    }
}
