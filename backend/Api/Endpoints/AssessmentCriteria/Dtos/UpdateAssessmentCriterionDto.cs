namespace Api.Endpoints.AssessmentCriteria.Dtos;

public record UpdateAssessmentCriterionDto
{
    public required string Criterion { get; init; }
}
