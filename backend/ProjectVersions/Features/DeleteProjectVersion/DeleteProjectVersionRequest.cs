using FluentValidation;
using Mediator;
using Shared;

namespace ProjectVersions.Features.DeleteProjectVersion;

public record DeleteProjectVersionRequest : IRequest<Result<DeleteProjectVersionResponse>>
{
    public Guid UserId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid VersionId { get; init; }
}

public sealed class DeleteProjectVersionRequestValidator : AbstractValidator<DeleteProjectVersionRequest>
{
    public DeleteProjectVersionRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();

        RuleFor(x => x.ProjectId).NotEmpty();

        RuleFor(x => x.VersionId).NotEmpty();
    }
}
