using FluentValidation;
using Traces.Contracts.Features.DeleteAllTracesOfVersion;

namespace Traces.Features.InternalDeleteAllTracesOfVersion;

public class InternalDeleteAllTracesOfVersionRequestValidator : AbstractValidator<DeleteAllTracesOfVersionRequest>
{
    public InternalDeleteAllTracesOfVersionRequestValidator()
    {
        RuleFor(x => x.VersionId).NotEmpty();
    }
}
