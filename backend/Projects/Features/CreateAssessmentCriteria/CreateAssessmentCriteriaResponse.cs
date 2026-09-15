using System;
using System.Collections.Generic;
using System.Text;

namespace Projects.Features.CreateAssessmentCriteria
{
    public class CreateAssessmentCriteriaResponse
    {
        public required Guid CriteriaId { get; init; }
        public required Guid ProjectId { get; init; }
        public required List<string> Criteria { get; init; }

    }
}
