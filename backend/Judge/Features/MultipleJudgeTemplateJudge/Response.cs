using Judge.Features.JudgeTracesForAxialCode;
using System;
using System.Collections.Generic;
using System.Text;

namespace Judge.Features.MultipleJudgeTemplateJudge
{
    public record MultipleJudgesResponse
    {
        public required IEnumerable<MultiResponseViewModel> Results { get; init; }
    }

    public record MultiResponseViewModel
    {
        public required Guid JudgeRunId { get; init; }
        public required IEnumerable<TraceJudgeResultViewModel> Results { get; init; }
    }
}
