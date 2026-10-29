using Mediator;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Contracts.Features.GetRawLLMOutput
{
    public record GetRawLLMOutputQuery : IRequest<Result<GetRawLLMOutputResponse>>
    {
        public required Guid RawLLMOutputId { get; init; }
    }
}
