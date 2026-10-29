using FluentValidation;
using Mediator;
using Shared;

namespace Judge.Features.ListJudgeRuns;

public record ListJudgeRunsRequest : IRequest<Result<ListJudgeRunsResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid UserId { get; init; }
    public int Limit { get; init; } = 20;
    public int Offset { get; init; } = 0;
}

public sealed class ListJudgeRunsRequestValidator : AbstractValidator<ListJudgeRunsRequest>
{
    public ListJudgeRunsRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Limit).InclusiveBetween(1, 100);
        RuleFor(x => x.Offset).GreaterThanOrEqualTo(0);
    }
}