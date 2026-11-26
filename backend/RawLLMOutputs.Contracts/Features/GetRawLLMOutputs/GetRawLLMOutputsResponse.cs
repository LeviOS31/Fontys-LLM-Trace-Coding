using RawLLMOutputs.Contracts.Features.GetRawLLMOutput;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Contracts.Features.GetRawLLMOutputs
{
    public class GetRawLLMOutputsResponse
    {
        public required List<GetRawLLMOutputResponse> RawLLMOutputs { get; init; }
    }
}
