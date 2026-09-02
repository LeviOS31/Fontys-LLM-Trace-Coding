using FluentValidation;
using Projects.Contracts.Features.GetProject;

namespace Projects.Features.GetProject;

public sealed class GetProjectRequestValidator : AbstractValidator<GetProjectQuery>
{
    public GetProjectRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();

        RuleFor(x => x.ProjectId).NotEmpty();
    }
}
