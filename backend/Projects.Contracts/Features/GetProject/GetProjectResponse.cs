using ProjectVersions.Contracts.Features.InternalGetProjectVersions;
using static Projects.Contracts.Features.GetAllAssessmentCriteriaOfProject.GetAllAssessmentCriteriaOfProjectResponse;

namespace Projects.Contracts.Features.GetProject;

public record GetProjectResponse
{
    public required Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required List<InternalGetProjectVersionsResponse.ProjectVersionSummary> Versions { get; init; }
    public required List<AssessmentCriteria> AssessmentCriteria { get; init; }
}