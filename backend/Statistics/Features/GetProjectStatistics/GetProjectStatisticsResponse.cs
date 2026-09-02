using Statistics.Features.Shared;

namespace Statistics.Features.GetProjectStatistics;

public record GetProjectStatisticsResponse
{
    public required int TotalTraceCount { get; init; }
    public required Dictionary<string, int> VersionTotalTraceCount { get; init; }
    public required int TotalOpenCodeCount { get; init; }
    public required int TotalAxialCodeCount { get; init; }
    public required Dictionary<string, IReadOnlyCollection<AxialCodeReturnItem>> VersionAxialCodes { get; init; }
}
