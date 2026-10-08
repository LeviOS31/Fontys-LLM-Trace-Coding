using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Features.ImportRawLLMData
{
    public record ImportRawLLMOutputResponse
    {
        public required Guid RawLLMDataId { get; init; }
        public required Guid ProjectVersionId { get; init; }
        public required string Name { get; init; }
        public required DateTime CreatedAt { get; init; }

    }
}
