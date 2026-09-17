using AssessmentCriteria.Contracts.Features.InternalDeleteAllAssessmentCriteriaOfProject;
using FluentValidation;

namespace AssessmentCriteria.Features.InternalDeleteAllAssessmentCriteriaOfProject;

public class InternalDeleteAllAssessmentCriteriaOfProjectRequestValidator
    : AbstractValidator<InternalDeleteAllAssessmentCriteriaOfProjectRequest>
{
    public InternalDeleteAllAssessmentCriteriaOfProjectRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
    }
}
