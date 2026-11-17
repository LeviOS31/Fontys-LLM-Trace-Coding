using System;
using System.Collections.Generic;
using System.Text;

namespace Judge.Features.GetJudgeCollection
{
    public record GetJudgeCollectionResponse
    {
        public required Guid JudgeCollectionId { get; init; }
        public required string Name { get; init; }
        public required Guid VersionId { get; init; }
        public required DateTimeOffset CreatedAt { get; init; }
    }
}
