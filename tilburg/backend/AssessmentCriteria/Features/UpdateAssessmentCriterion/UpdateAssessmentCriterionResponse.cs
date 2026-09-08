namespace AssessmentCriteria.Features.UpdateAssessmentCriterion;

public record UpdateAssessmentCriterionResponse
{
    public required Guid CriterionId { get; init; }
    public required Guid ProjectId { get; init; }
    public required string Criterion { get; init; }
}
