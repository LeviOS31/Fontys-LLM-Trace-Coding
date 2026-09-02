using FluentValidation;
using Mediator;
using Shared;

namespace Settings.Features.SetLlmConfig;

public record SetLlmConfigRequest : IRequest<Result<SetLlmConfigResponse>>
{
    public Guid UserId { get; init; }
    public required string? ProviderName { get; init; }
    public required Uri? Endpoint { get; init; }
    public required string? ModelName { get; init; }
}

public sealed class SetLlmConfigRequestValidator : AbstractValidator<SetLlmConfigRequest>
{
    public SetLlmConfigRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x)
            .Must(x =>
                (x.ProviderName is null && x.Endpoint is null && x.ModelName is null)
                || (x.ProviderName is not null && x.Endpoint is not null && x.ModelName is not null)
            )
            .WithMessage("ProviderName, Endpoint, and ModelName must be all null or all non-null.");
    }
}
