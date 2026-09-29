namespace AssessmentCriteria.Contracts.Features.InternalGetAllAssessmentCriteriaOfProject;

public record InternalGetAllAssessmentCriteriaOfProjectResponse
{
    public required List<AssessmentCriterion> CriteriaList { get; init; }

    public record AssessmentCriterion
    {
        public required Guid CriterionId { get; set; }
        public required string Criterion { get; set; }
    }
}
