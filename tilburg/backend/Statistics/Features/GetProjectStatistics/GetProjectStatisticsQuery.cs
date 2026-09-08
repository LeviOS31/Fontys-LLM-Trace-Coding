using Mediator;
using Shared;

namespace Statistics.Features.GetProjectStatistics;

public record GetProjectStatisticsQuery : IRequest<Result<GetProjectStatisticsResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid UserId { get; init; }
}
