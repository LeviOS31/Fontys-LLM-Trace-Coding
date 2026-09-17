namespace ProjectVersions.Contracts.Features.InternalGetProjectVersions;

public record InternalGetProjectVersionsResponse
{
    public required List<ProjectVersionSummary> Versions { get; init; }

    public record ProjectVersionSummary
    {
        public required Guid VersionId { get; init; }
        public required Guid ProjectId { get; init; }
        public required string Name { get; init; }
        public required string Description { get; init; }
    }
}
