using Api.Extensions;
using Mediator;
using Statistics.Features.GetProjectStatistics;
using Statistics.Features.GetProjectVersionStatistics;

namespace Api.Endpoints.Statistics;

public static class StatisticsEndpoint
{
    public static void MapStatisticsEndpoint(this WebApplication app)
    {
        app.MapGet(
                "/v1/projects/{projectId:guid}/statistics",
                async Task<IResult> (Guid projectId, IMediator mediator) =>
                {
                    var request = new GetProjectStatisticsQuery()
                    {
                        ProjectId = projectId,
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                    };

                    var result = await mediator.Send(request);
                    return result.ToHttpResult();
                }
            )
            .WithTags("Statistics");

        app.MapGet(
                "/v1/projects/{projectId:guid}/versions/{versionId:guid}/statistics",
                async Task<IResult> (Guid projectId, Guid versionId, IMediator mediator) =>
                {
                    var request = new GetProjectVersionStatisticsQuery()
                    {
                        ProjectId = projectId,
                        VersionId = versionId,
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                    };

                    var result = await mediator.Send(request);
                    return result.ToHttpResult();
                }
            )
            .WithTags("Statistics");
    }
}
