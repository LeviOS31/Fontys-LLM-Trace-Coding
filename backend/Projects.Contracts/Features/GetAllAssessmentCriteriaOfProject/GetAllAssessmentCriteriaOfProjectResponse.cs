namespace Projects.Contracts.Features.GetAllAssessmentCriteriaOfProject
{
    public record GetAllAssessmentCriteriaOfProjectResponse
    {
        public required List<AssessmentCriteria> criteriaList { get; init; }

        public record AssessmentCriteria
        {
            public required Guid CriteriaId { get; set; }
            public required string Criteria { get; set; }
        }
    }
}
