using FluentValidation;
using Mediator;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace Projects.Features.DeleteALLProjectVersions
{
    public class DeleteAllProjectVersionRequest: IRequest<Result<DeleteAllProjectVersionRepsonse>>
    {
        public Guid ProjectId { get; init; }
    }

    public sealed class  DeleteAllProjectVersionRequestValidator: AbstractValidator<DeleteAllProjectVersionRequest>
    {
        public DeleteAllProjectVersionRequestValidator()
        {
            RuleFor(x => x.ProjectId).NotEmpty();
        }
    }
}
