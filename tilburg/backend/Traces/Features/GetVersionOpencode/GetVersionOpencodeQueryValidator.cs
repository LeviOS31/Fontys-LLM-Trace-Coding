using FluentValidation;
using Traces.Contracts.Features.GetVersionOpencode;

namespace Traces.Features.GetVersionOpencode;

public sealed class GetVersionOpencodeQueryValidator : AbstractValidator<GetVersionOpencodeQuery>
{
    public GetVersionOpencodeQueryValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}
