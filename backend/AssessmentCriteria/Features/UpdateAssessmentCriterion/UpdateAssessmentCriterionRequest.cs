using AssessmentCriteria.Data.Models;
using FluentValidation;
using Mediator;
using Shared;

namespace AssessmentCriteria.Features.UpdateAssessmentCriterion;

public record UpdateAssessmentCriterionRequest : IRequest<Result<UpdateAssessmentCriterionResponse>>
{
    public Guid UserId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid CriterionId { get; init; }
    public required string Criterion { get; init; }
}

public sealed class UpdateAssessmentCriterionRequestValidator : AbstractValidator<UpdateAssessmentCriterionRequest>
{
    public UpdateAssessmentCriterionRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();

        RuleFor(x => x.ProjectId).NotEmpty();

        RuleFor(x => x.CriterionId).NotEmpty();

        RuleFor(x => x.Criterion).Length(AssessmentCriterion.MinLength, AssessmentCriterion.MaxLength);
    }
}
