using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Features.ImportRawLLMOutput
{
    public record ImportRawLLMOutputResponse
    {
        public required Guid RawLLMOutputId { get; init; }
        public required Guid ProjectVersionId { get; init; }
        public required string Name { get; init; }
        public required DateTime CreatedAt { get; init; }

    }
}
