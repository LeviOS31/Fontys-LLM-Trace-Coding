using System;
using FluentValidation;
using Mediator;
using Projects.Data.Models;
using Shared;

namespace Projects.Features.CreateProject;

public record CreateProjectRequest : IRequest<Result<CreateProjectResponse>>
{
    public Guid UserId { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
}

public sealed class CreateProjectRequestValidator : AbstractValidator<CreateProjectRequest>
{
    public CreateProjectRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();

        RuleFor(x => x.Name).Length(Project.MinNameLength, Project.MaxNameLength);

        RuleFor(x => x.Description).MaximumLength(Project.MaxDescriptionLength);
    }
}
