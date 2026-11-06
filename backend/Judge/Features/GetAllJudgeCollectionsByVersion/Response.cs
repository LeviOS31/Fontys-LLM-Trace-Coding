using System;
using System.Collections.Generic;
using System.Text;

namespace Judge.Features.GetAllJudgeCollectionsByVersion
{
    public record GetAllJudgeCollectionsByVersionResponse
    {
        public required IEnumerable<JudgeCollection> JudgeCollections { get; init; }
    }

    public record JudgeCollection
    {
        public required Guid JudgeCollectionId { get; init; }
        public required string Name { get; init; }
        public required Guid VersionId { get; init; }
        public required DateTimeOffset CreatedAt { get; init; }
    }
}
