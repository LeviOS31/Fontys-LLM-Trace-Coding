using System;
using FluentValidation;
using Mediator;
using Shared;

namespace Projects.Features.DeleteProject;

public class DeleteProjectRequest : IRequest<Result<DeleteProjectResponse>>
{
    public Guid ProjectId { get; init; }
    public Guid UserId { get; init; }
}

public sealed class DeleteProjectRequestValidator : AbstractValidator<DeleteProjectRequest>
{
    public DeleteProjectRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}
