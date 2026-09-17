using FluentValidation;
using Mediator;
using Shared;

namespace Projects.Features.DeleteAssessmentCriteria
{
    public class DeleteAssessmentCriteriaRequest: IRequest<Result<DeleteAssessmentCriteriaResponse>>
    {
        public Guid UserId { get; init; }
        public required Guid ProjectId { get; init; }
        public required Guid CriteriaId { get; init; }
    }

    public sealed class DeleteAssessmentCriteriaRequestValidator : AbstractValidator<DeleteAssessmentCriteriaRequest>
    {
        public DeleteAssessmentCriteriaRequestValidator()
        {
            RuleFor(x => x.UserId).NotEmpty();

            RuleFor(x => x.ProjectId).NotEmpty();

            RuleFor(x => x.CriteriaId).NotEmpty();
        }
    }
}

