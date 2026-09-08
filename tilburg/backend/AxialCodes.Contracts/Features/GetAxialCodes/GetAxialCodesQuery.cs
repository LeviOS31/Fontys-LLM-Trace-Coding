using FluentValidation;
using Mediator;
using Shared;

namespace AxialCodes.Contracts.Features.GetAxialCodes;

public record GetAxialCodesQuery : IRequest<Result<GetAxialCodesResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid UserId { get; init; }
}

public sealed class GetAxialCodesQueryValidator : AbstractValidator<GetAxialCodesQuery>
{
    public GetAxialCodesQueryValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}
