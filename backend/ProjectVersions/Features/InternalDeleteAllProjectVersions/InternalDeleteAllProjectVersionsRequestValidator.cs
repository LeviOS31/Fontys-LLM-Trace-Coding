using FluentValidation;
using ProjectVersions.Contracts.Features.InternalDeleteAllProjectVersions;

namespace ProjectVersions.Features.InternalDeleteAllProjectVersions;

public class InternalDeleteAllProjectVersionsRequestValidator
    : AbstractValidator<InternalDeleteAllProjectVersionsRequest>
{
    public InternalDeleteAllProjectVersionsRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
    }
}
