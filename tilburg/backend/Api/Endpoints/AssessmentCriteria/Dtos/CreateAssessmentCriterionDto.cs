namespace Api.Endpoints.AssessmentCriteria.Dtos;

public record CreateAssessmentCriterionDto
{
    public required string Criterion { get; init; }
}
