using RawLLMOutputs.Contracts.Features.GetRawLLMOutput;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Contracts.Features.GetAllRawLLMOutputOfVersion
{
    public record GetAllRawLLMOutputOfVersionResponse
    {
        public required List<GetRawLLMOutputResponse> RawLLMOutputs { get; init; }
    }
}
