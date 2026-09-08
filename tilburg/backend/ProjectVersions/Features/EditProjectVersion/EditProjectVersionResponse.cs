namespace ProjectVersions.Features.EditProjectVersion;

public record EditProjectVersionResponse
{
    public required Guid VersionId { get; init; }
    public required Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
}
