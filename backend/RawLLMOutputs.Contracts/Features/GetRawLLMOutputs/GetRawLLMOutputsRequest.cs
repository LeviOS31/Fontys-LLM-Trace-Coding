using Mediator;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Contracts.Features.GetRawLLMOutputs
{
    public class GetRawLLMOutputsRequest : IRequest<Result<GetRawLLMOutputsResponse>>
    {
        public required Guid[] RawLLMOutputIds { get; init; }
    }
}
