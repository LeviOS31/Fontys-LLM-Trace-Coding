using FluentValidation;
using Mediator;
using Shared;

namespace AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;

public record InternalGetAllAxialCodesByVersionRequest : IRequest<Result<InternalGetAllAxialCodesByVersionResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid UserId { get; init; }
}

public sealed class InternalGetAllAxialCodesByVersionRequestValidator
    : AbstractValidator<InternalGetAllAxialCodesByVersionRequest>
{
    public InternalGetAllAxialCodesByVersionRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}
