using Mediator;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Contracts.Features.DeleteAllRawLLMOutputOfVersion
{
    public record DeleteAllRawLLMOutputOfVersionQuery: IRequest<Result<DeleteAllRawLLMOutputOfVersionResponse>>
    {
        public required Guid VersionId { get; init; }
    }
}
