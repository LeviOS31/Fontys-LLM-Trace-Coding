using FluentValidation;
using Mediator;
using Shared;

namespace Judge.Features.UpdateJudgeRunFeedback;

public record UpdateJudgeRunFeedbackRequest : IRequest<Result<UpdateJudgeRunFeedbackResponse>>
{
    public required Guid UserId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid JudgeCollectionId { get; init; }
    public required Guid JudgeRunId { get; init; }
    public required string Feedback { get; init; }
}

public record UpdateJudgeRunFeedbackResponse;

public sealed class UpdateJudgeRunFeedbackRequestValidator : AbstractValidator<UpdateJudgeRunFeedbackRequest>
{
    public UpdateJudgeRunFeedbackRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.JudgeCollectionId).NotEmpty();
        RuleFor(x => x.JudgeRunId).NotEmpty();
        RuleFor(x => x.Feedback).MaximumLength(4000);
    }
}