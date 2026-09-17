using AssessmentCriteria.Contracts.Features.InternalGetAllAssessmentCriteriaOfProject;
using ProjectVersions.Contracts.Features.InternalGetProjectVersions;

namespace Projects.Contracts.Features.GetProject;

public record GetProjectResponse
{
    public required Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required List<InternalGetProjectVersionsResponse.ProjectVersionSummary> Versions { get; init; }
    public required List<InternalGetAllAssessmentCriteriaOfProjectResponse.AssessmentCriterion> AssessmentCriteria { get; init; }
}
