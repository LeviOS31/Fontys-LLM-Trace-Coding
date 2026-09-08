using System;
using FluentValidation;
using Mediator;
using Projects.Data.Models;
using Shared;

namespace Projects.Features.EditProject;

public record EditProjectRequest : IRequest<Result<EditProjectResponse>>
{
    public Guid UserId { get; init; }
    public Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
}

public sealed class EditProjectRequestValidator : AbstractValidator<EditProjectRequest>
{
    public EditProjectRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();

        RuleFor(x => x.ProjectId).NotEmpty();

        RuleFor(x => x.Name).Length(Project.MinNameLength, Project.MaxNameLength);

        RuleFor(x => x.Description).MaximumLength(Project.MaxDescriptionLength);
    }
}
