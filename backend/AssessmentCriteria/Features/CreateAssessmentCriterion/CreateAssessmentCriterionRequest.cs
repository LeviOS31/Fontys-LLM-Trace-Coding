using AssessmentCriteria.Data.Models;
using FluentValidation;
using Mediator;
using Shared;

namespace AssessmentCriteria.Features.CreateAssessmentCriterion;

public record CreateAssessmentCriterionRequest : IRequest<Result<CreateAssessmentCriterionResponse>>
{
    public Guid UserId { get; init; }
    public required Guid ProjectId { get; init; }
    public required string Criterion { get; init; }
}

public sealed class CreateAssessmentCriterionRequestValidator : AbstractValidator<CreateAssessmentCriterionRequest>
{
    public CreateAssessmentCriterionRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();

        RuleFor(x => x.ProjectId).NotEmpty();

        RuleFor(x => x.Criterion).Length(AssessmentCriterion.MinLength, AssessmentCriterion.MaxLength);
    }
}
