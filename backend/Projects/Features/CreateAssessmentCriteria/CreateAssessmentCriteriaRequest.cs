using FluentValidation;
using Mediator;
using AssessmentCriteriaModel = Projects.Data.Models.AssessmentCriteria;
using Shared;

namespace Projects.Features.CreateAssessmentCriteria
{
    public class CreateAssessmentCriteriaRequest : IRequest<Result<CreateAssessmentCriteriaResponse>>
    {
        public required Guid UserId { get; init; }
        public required Guid ProjectId { get; init; }
        public required string Criteria { get; init; }

    }

    public sealed class CreateAssessmentCriteriaRequestValidator : AbstractValidator<CreateAssessmentCriteriaRequest>
    {
        public CreateAssessmentCriteriaRequestValidator()
        {
            RuleFor(x => x.UserId).NotEmpty();
            RuleFor(x => x.ProjectId).NotEmpty();
            RuleFor(x => x.Criteria).Length(AssessmentCriteriaModel.MinLength, AssessmentCriteriaModel.MaxLength);
        }
    }
}
