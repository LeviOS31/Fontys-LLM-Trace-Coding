using FluentValidation;
using Mediator;
using Shared;
using Traces.Dtos;

namespace Traces.Features.GetTraceSummaries;

public record GetTraceGroupSummaryQuery : IRequest<Result<GetTraceGroupSummaryResponse>>
{
    public Guid ProjectId { get; init; }
    public Guid UserId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public List<FilterDto>? Filters { get; init; }
}

public sealed class GetTracesSummaryQueryValidator : AbstractValidator<GetTraceGroupSummaryQuery>
{
    public GetTracesSummaryQueryValidator()
    {
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}
