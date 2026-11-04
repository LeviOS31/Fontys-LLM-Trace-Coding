using System;
using System.Collections.Generic;
using System.Text;

namespace Judge.Features.GetAllJudgeCollectionsByVersion
{
    public record GetAllJudgeCollectionsByVersion
    {
        public required IEnumerable<JudgeCollection> JudgeCollections { get; init; }
    }

    public record JudgeCollection
    {
        public required Guid Id { get; init; }
        public required string Name { get; init; }
        public required string Version { get; init; }
        public required DateTime CreatedAt { get; init; }
    }
}
