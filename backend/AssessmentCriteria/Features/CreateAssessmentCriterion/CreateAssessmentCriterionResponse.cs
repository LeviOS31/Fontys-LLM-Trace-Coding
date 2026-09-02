namespace AssessmentCriteria.Features.CreateAssessmentCriterion;

public record CreateAssessmentCriterionResponse
{
    public required Guid CriterionId { get; init; }
    public required Guid ProjectId { get; init; }
    public required string Criterion { get; init; }
}
