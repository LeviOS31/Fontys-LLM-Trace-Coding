namespace Api.Endpoints.AssessmentCriteria.Dtos;

public record CreateAssessmentCriteriaDto
{
    public required string Criteria { get; init; }
}
