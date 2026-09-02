using FluentValidation;
using Mediator;
using Shared;

namespace AssessmentCriteria.Features.DeleteAssessmentCriterion;

public record DeleteAssessmentCriterionRequest : IRequest<Result<DeleteAssessmentCriterionResponse>>
{
    public Guid UserId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid CriterionId { get; init; }
}

public sealed class DeleteAssessmentCriterionRequestValidator : AbstractValidator<DeleteAssessmentCriterionRequest>
{
    public DeleteAssessmentCriterionRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();

        RuleFor(x => x.ProjectId).NotEmpty();

        RuleFor(x => x.CriterionId).NotEmpty();
    }
}
