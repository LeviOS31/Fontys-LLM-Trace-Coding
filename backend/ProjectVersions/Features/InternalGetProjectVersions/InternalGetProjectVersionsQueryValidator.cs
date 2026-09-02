using FluentValidation;
using ProjectVersions.Contracts.Features.InternalGetProjectVersions;

namespace ProjectVersions.Features.InternalGetProjectVersions;

public class InternalGetProjectVersionsQueryValidator : AbstractValidator<InternalGetProjectVersionsQuery>
{
    public InternalGetProjectVersionsQueryValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
    }
}
