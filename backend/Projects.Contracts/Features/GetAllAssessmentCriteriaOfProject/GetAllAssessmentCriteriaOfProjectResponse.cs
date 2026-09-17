namespace Projects.Contracts.Features.GetAllAssessmentCriteriaOfProject
{
    public record GetAllAssessmentCriteriaOfProjectResponse
    {
        public required List<AssessmentCriteria> criteriaList { get; init; }

        public record AssessmentCriteria
        {
            public required Guid CriterionId { get; set; }
            public required string Criterion { get; set; }
        }
    }
}
