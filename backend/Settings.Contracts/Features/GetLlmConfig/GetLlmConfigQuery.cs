using FluentValidation;
using Mediator;
using Shared;

namespace Settings.Contracts.Features.GetLlmConfig;

public record GetLlmConfigQuery : IRequest<Result<GetLlmConfigResponse>>
{
    public required Guid UserId { get; init; }
}

public sealed class GetLlmConfigQueryValidator : AbstractValidator<GetLlmConfigQuery>
{
    public GetLlmConfigQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}
