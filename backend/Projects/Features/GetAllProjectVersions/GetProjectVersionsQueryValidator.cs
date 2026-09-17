using FluentValidation;
using Projects.Contracts.Features.GetAllProjectVersions;

namespace Projects.Features.GetProjectVersions
{
    public class GetProjectVersionsQueryValidator
        :AbstractValidator<GetAllProjectVersionsQuery>
    {
        public GetProjectVersionsQueryValidator()
        {
            RuleFor(x => x.ProjectId).NotEmpty();
        }
    }
}
