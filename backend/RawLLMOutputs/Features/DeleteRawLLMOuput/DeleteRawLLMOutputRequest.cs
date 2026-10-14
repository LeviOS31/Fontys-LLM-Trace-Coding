using FluentValidation;
using Mediator;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Features.DeleteRawLLMOuput
{
    public class DeleteRawLLMOutputRequest: IRequest<Result<DeleteRawLLMOutputResponse>>
    {
        public Guid UserId { get; init; }
        public required Guid RawLLMOutputId { get; init; }
        public required Guid ProjectId { get; init; }
        public required Guid ProjectVersionId { get; init; }
    }

    public sealed class DeleteRawLLMOutputRequestValidator : AbstractValidator<DeleteRawLLMOutputRequest>
    {
        public DeleteRawLLMOutputRequestValidator()
        {
            RuleFor(x => x.RawLLMOutputId).NotEmpty();
            RuleFor(x => x.ProjectId).NotEmpty();
            RuleFor(x => x.ProjectVersionId).NotEmpty();
        }
    }
}
