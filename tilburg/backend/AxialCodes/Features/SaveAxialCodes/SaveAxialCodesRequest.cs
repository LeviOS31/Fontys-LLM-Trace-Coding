using FluentValidation;
using Mediator;
using Shared;

namespace AxialCodes.Features.SaveAxialCodes;

public record SaveAxialCodesRequest : IRequest<Result<SaveAxialCodesResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid AxialCodingResultId { get; init; }
    public required Guid UserId { get; init; }
}

public sealed class SaveAxialCodesRequestValidator : AbstractValidator<SaveAxialCodesRequest>
{
    public SaveAxialCodesRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.AxialCodingResultId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}
