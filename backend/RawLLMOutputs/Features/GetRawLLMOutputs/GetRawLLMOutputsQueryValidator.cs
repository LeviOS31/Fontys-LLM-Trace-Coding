using FluentValidation;
using RawLLMOutputs.Contracts.Features.GetRawLLMOutputs;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Features.GetRawLLMOutputs
{
    public sealed class GetRawLLMOutputsQueryValidator: AbstractValidator<GetRawLLMOutputsRequest>
    {
        public GetRawLLMOutputsQueryValidator()
        {
            RuleFor(x => x.RawLLMOutputIds).NotEmpty();
        }
    }
}
