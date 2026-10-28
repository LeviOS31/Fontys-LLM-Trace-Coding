using FluentValidation;
using Judge.Features.JudgeTracesForAxialCode;
using Mediator;
using Shared;

namespace Judge.Features.GetJudgeRun;

public record GetJudgeRunRequest : IRequest<Result<GetJudgeRunResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid JudgeRunId { get; init; }
    public required Guid UserId { get; init; }
}

public record GetJudgeRunResponse
{
    public required Guid JudgeRunId { get; init; }
    public required IEnumerable<TraceJudgeResultViewModel> Results { get; init; }
}

public sealed class GetJudgeRunRequestValidator : AbstractValidator<GetJudgeRunRequest>
{
    public GetJudgeRunRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.JudgeRunId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}