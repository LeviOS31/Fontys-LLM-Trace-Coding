using FluentValidation;
using Mediator;
using Shared;

namespace AxialCodes.Features.GenerateAxialCodingResult;

public class GenerateAxialCodingResultRequest : IRequest<Result<GenerateAxialCodingResultResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid UserId { get; init; }

    public required string? Feedback { get; init; }
    public required IEnumerable<AxialCodeViewModel>? AxialCodes { get; init; }
}

public sealed class GenerateAxialCodingResultRequestValidator : AbstractValidator<GenerateAxialCodingResultRequest>
{
    public GenerateAxialCodingResultRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}
