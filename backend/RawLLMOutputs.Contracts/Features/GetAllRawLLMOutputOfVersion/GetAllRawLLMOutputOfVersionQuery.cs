using Mediator;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Contracts.Features.GetAllRawLLMOutputOfVersion
{
    public record GetAllRawLLMOutputOfVersionQuery: IRequest<Result<GetAllRawLLMOutputOfVersionResponse>>
    {
        public required Guid VersionId { get; init; }
    }
}
