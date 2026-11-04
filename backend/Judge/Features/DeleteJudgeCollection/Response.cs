using System;
using System.Collections.Generic;
using System.Text;

namespace Judge.Features.DeleteJudgeCollection
{
    public record DeleteJudgeCollectionResponse
    {
        public Guid JudgeCollectionId { get; init; }
    }
}
