using FluentValidation;
using Mediator;
using ProjectVersions.Data.Models;
using Shared;

namespace ProjectVersions.Features.CreateProjectVersion;

public record CreateProjectVersionRequest : IRequest<Result<CreateProjectVersionResponse>>
{
    public Guid UserId { get; init; }
    public required Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
}

public sealed class CreateProjectVersionRequestValidator : AbstractValidator<CreateProjectVersionRequest>
{
    public CreateProjectVersionRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();

        RuleFor(x => x.ProjectId).NotEmpty();

        RuleFor(x => x.Name)
            .NotEmpty()
            .MinimumLength(ProjectVersion.MinNameLength)
            .MaximumLength(ProjectVersion.MaxNameLength);

        RuleFor(x => x.Description).NotEmpty().MaximumLength(ProjectVersion.MaxDescriptionLength);
    }
}
