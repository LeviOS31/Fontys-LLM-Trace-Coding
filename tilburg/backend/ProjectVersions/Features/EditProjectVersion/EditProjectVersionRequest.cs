using FluentValidation;
using Mediator;
using ProjectVersions.Data.Models;
using Shared;

namespace ProjectVersions.Features.EditProjectVersion;

public record EditProjectVersionRequest : IRequest<Result<EditProjectVersionResponse>>
{
    public Guid UserId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid VersionId { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
}

public sealed class EditProjectVersionRequestValidator : AbstractValidator<EditProjectVersionRequest>
{
    public EditProjectVersionRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();

        RuleFor(x => x.ProjectId).NotEmpty();

        RuleFor(x => x.VersionId).NotEmpty();

        RuleFor(x => x.Name).Length(ProjectVersion.MinNameLength, ProjectVersion.MaxNameLength);

        RuleFor(x => x.Description).NotEmpty().Length(1, ProjectVersion.MaxDescriptionLength);
    }
}
