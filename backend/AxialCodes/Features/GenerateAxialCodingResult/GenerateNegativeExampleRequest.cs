using FluentValidation;
using Mediator;
using Shared;

namespace AxialCodes.Features.GenerateAxialCodingResult;

public sealed record GenerateNegativeExampleRequest : IRequest<Result<GenerateNegativeExampleResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid UserId { get; init; }
    public required string Label { get; init; }
    public required string Description { get; init; }
    public required string JudgeGuidelines { get; init; }
    public string? PositiveExampleTrace { get; init; }
}

public sealed record GenerateNegativeExampleResponse
{
    public required string Trace { get; init; }
    public required string Reasoning { get; init; }
}

public sealed class GenerateNegativeExampleRequestValidator : AbstractValidator<GenerateNegativeExampleRequest>
{
    public GenerateNegativeExampleRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Label).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.JudgeGuidelines).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.PositiveExampleTrace).MaximumLength(1100);
    }
}
