using FluentValidation;
using RawLLMOutputs.Contracts.Features.DeleteAllRawLLMOutputOfVersion;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Features.DeleteAllRawLLMOutputOfVersion
{
    public class DeleteAllRawLLMOutputOfVersionQueryValidator : AbstractValidator<DeleteAllRawLLMOutputOfVersionQuery>
    {
        public DeleteAllRawLLMOutputOfVersionQueryValidator()
        {
            RuleFor(x => x.VersionId).NotEmpty();
        }
    }
}
