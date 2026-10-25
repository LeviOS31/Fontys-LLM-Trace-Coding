using FluentValidation;
using RawLLMOutputs.Contracts.Features.GetAllRawLLMOutputOfVersion;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Features.GetAllRawLLMOutputOfVersion
{
    public sealed class GetAllRawLLMOutputofVersionQueryValidator : AbstractValidator<GetAllRawLLMOutputOfVersionQuery>
    {
        public GetAllRawLLMOutputofVersionQueryValidator()
        {
            RuleFor(x => x.VersionId).NotEmpty();
        }
    }
}
