using FluentValidation;
using Mediator;
using Shared;

namespace AxialCodes.Contracts.Features.InternalGetAxialCodeById;

public record InternalGetAxialCodeByIdRequest : IRequest<Result<InternalGetAxialCodeByIdResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid AxialCodeId { get; init; }
    public required Guid UserId { get; init; }
}

public sealed class InternalGetAxialCodeByIdRequestValidator : AbstractValidator<InternalGetAxialCodeByIdRequest>
{
    public InternalGetAxialCodeByIdRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.AxialCodeId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}
