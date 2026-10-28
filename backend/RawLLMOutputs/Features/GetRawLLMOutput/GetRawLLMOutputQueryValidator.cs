using FluentValidation;
using RawLLMOutputs.Contracts.Features.GetRawLLMOutput;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Features.GetRawLLMOutput
{
    public sealed class GetRawLLMOutputQueryValidator : AbstractValidator<GetRawLLMOutputQuery>
    {
        public GetRawLLMOutputQueryValidator() 
        {
            RuleFor(x => x.RawLLMOutputId).NotEmpty();
        }
    }
}
