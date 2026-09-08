using Mediator;
using Shared;

namespace Statistics.Features.GetProjectVersionStatistics;

public record GetProjectVersionStatisticsQuery : IRequest<Result<GetProjectVersionStatisticsResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid VersionId { get; init; }
    public required Guid UserId { get; init; }
}
