using FluentValidation;
using Mediator;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Features.UpdateRawLLMOutput
{
    public record UpdateRawLLMOutputRequest: IRequest<Result<UpdateRawLLMOutputResponse>>
    {
        public required Guid RawLLMOutputId { get; init; }
        public required Guid VersionId { get; init; }
        public required string Name { get; init; }
    }

    public sealed class EditRawLLMOutputRequestValidator : AbstractValidator<UpdateRawLLMOutputRequest>
    {
        public EditRawLLMOutputRequestValidator()
        {
            RuleFor(x => x.RawLLMOutputId).NotEmpty();
            RuleFor(x => x.VersionId).NotEmpty();
            RuleFor(x => x.Name).NotEmpty();
        }
    }
}
