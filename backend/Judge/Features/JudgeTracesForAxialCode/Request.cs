using FluentValidation;
using Mediator;
using Shared;

namespace Judge.Features.JudgeTracesForAxialCode;

public record JudgeTracesForAxialCodeRequest : IRequest<Result<JudgeTracesForAxialCodeResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid AxialCodeId { get; init; }
    public required Guid UserId { get; init; }
    public Guid? TraceCollectionId { get; init; }
    public Guid? TraceId { get; init; }
}

public sealed class JudgeTracesForAxialCodeRequestValidator : AbstractValidator<JudgeTracesForAxialCodeRequest>
{
    public JudgeTracesForAxialCodeRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.AxialCodeId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}