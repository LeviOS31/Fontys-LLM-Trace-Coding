using Statistics.Features.Shared;

namespace Statistics.Features.GetProjectVersionStatistics;

public record GetProjectVersionStatisticsResponse
{
    public required int VersionTraceCount { get; init; }
    public required int VersionOpenCodeCount { get; init; }
    public required int VersionAxialCodeCount { get; init; }
    public required IReadOnlyCollection<AxialCodeReturnItem> VersionAxialCodes { get; init; }
}
