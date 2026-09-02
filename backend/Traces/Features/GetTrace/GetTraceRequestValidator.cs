using FluentValidation;
using Traces.Contracts.Features.GetTrace;

namespace Traces.Features.GetTrace;

public sealed class GetTraceQueryValidator : AbstractValidator<GetTraceQuery>
{
    public GetTraceQueryValidator()
    {
        RuleFor(x => x.TraceId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ProjectId).NotEmpty();
    }
}
