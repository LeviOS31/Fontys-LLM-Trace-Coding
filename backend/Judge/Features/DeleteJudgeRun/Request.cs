using FluentValidation;
using Mediator;
using Shared;

namespace Judge.Features.DeleteJudgeRun;

public record DeleteJudgeRunRequest : IRequest<Result<DeleteJudgeRunResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid JudgeRunId { get; init; }
    public required Guid UserId { get; init; }
}

public record DeleteJudgeRunResponse
{
    public required Guid JudgeRunId { get; init; }
}

public sealed class DeleteJudgeRunRequestValidator : AbstractValidator<DeleteJudgeRunRequest>
{
    public DeleteJudgeRunRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.JudgeRunId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}