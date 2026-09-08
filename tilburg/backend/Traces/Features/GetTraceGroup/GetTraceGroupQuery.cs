using FluentValidation;
using Mediator;
using Shared;

namespace Traces.Features.GetTraceGroup;

public record GetTraceGroupQuery : IRequest<Result<GetTraceGroupResponse>>
{
    public Guid ProjectId { get; init; }
    public Guid UserId { get; init; }
    public required Guid TraceGroupId { get; init; }
    public required Guid ProjectVersionId { get; init; }
}

public sealed class GetTraceGroupValidator : AbstractValidator<GetTraceGroupQuery>
{
    public GetTraceGroupValidator()
    {
        RuleFor(x => x.TraceGroupId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ProjectId).NotEmpty();
    }
}
