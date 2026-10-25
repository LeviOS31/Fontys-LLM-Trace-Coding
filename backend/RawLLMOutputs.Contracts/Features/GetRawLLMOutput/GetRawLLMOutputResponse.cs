using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Contracts.Features.GetRawLLMOutput
{
    public record GetRawLLMOutputResponse
    {
        public required Guid RawLLMOutputId { get; init; }
        public required Guid VersionId { get; init; }
        public required string Name { get; init; }
        public required string Output { get; init; }
        public required DateTime CreatedAt { get; init; }
    }
}
