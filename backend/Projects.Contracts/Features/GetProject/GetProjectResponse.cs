using Projects.Contracts.Features.GetAllAssessmentCriteriaOfProject;
using Projects.Contracts.Features.GetAllProjectVersions;

namespace Projects.Contracts.Features.GetProject;

public record GetProjectResponse
{
    public required Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required List<GetAllProjectVersionsResponse.ProjectVersionSummary> Versions { get; init; }
    public required List<GetAllAssessmentCriteriaOfProjectResponse.AssessmentCriteria> AssessmentCriteria { get; init; }
}