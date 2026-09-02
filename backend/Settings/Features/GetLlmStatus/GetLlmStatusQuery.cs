using FluentValidation;
using Mediator;
using Shared;

namespace Settings.Features.GetLlmStatus;

public record GetLlmStatusQuery : IRequest<Result<GetLlmStatusResponse>>
{
    public required Guid UserId { get; init; }
}

public sealed class GetLlmStatusQueryValidator : AbstractValidator<GetLlmStatusQuery>
{
    public GetLlmStatusQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}
