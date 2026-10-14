using FluentValidation;
using Mediator;
using Shared;

namespace AxialCodes.Features.UpdateAxialCodeFeedback;

public record UpdateAxialCodeFeedbackRequest : IRequest<Result<UpdateAxialCodeFeedbackResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid AxialCodeId { get; init; }
    public required Guid UserId { get; init; }
    public string? Feedback { get; init; }
}

public sealed class UpdateAxialCodeFeedbackRequestValidator : AbstractValidator<UpdateAxialCodeFeedbackRequest>
{
    public UpdateAxialCodeFeedbackRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.AxialCodeId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Feedback).MaximumLength(AxialCodes.Data.Models.AxialCode.MaxFeedbackLength);
    }
}