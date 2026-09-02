using System.Threading;
using Mediator;
using Microsoft.Extensions.DependencyInjection;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;
using Statistics.Features.GetProjectVersionStatistics;
using Statistics.Features.Shared;

namespace Statistics.Features.GetProjectStatistics;

public class GetProjectStatisticsHandler
    : IRequestHandler<GetProjectStatisticsQuery, Result<GetProjectStatisticsResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetProjectStatisticsHandler>();
    private readonly IMediator _mediator;
    private readonly IServiceScopeFactory _scopeFactory;

    public GetProjectStatisticsHandler(IMediator mediator, IServiceScopeFactory scopeFactory)
    {
        _mediator = mediator;
        _scopeFactory = scopeFactory;
    }

    public async ValueTask<Result<GetProjectStatisticsResponse>> Handle(
        GetProjectStatisticsQuery query,
        CancellationToken cancellationToken
    )
    {
        // Validate ownership
        var projectResult = await _mediator.Send(
            new GetProjectQuery { ProjectId = query.ProjectId, UserId = query.UserId },
            cancellationToken
        );

        if (projectResult.IsError)
        {
            return projectResult.ErrorCode!.Value;
        }

        var versionTotalTraceCount = new Dictionary<string, int>();
        var versionAxialCodes = new Dictionary<string, IReadOnlyCollection<AxialCodeReturnItem>>();
        var totalTraceCount = 0;
        var totalOpenCodeCount = 0;
        var totalAxialCodeCount = 0;

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

        var versionTasks = projectResult
            .Value.Versions.Select(version =>
                Task.Run(
                    async () =>
                    {
                        await using var scope = _scopeFactory.CreateAsyncScope();
                        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

                        return (
                            version,
                            result: await mediator.Send(
                                new GetProjectVersionStatisticsQuery
                                {
                                    ProjectId = query.ProjectId,
                                    VersionId = version.VersionId,
                                    UserId = query.UserId,
                                },
                                cts.Token
                            )
                        );
                    },
                    cts.Token
                )
            )
            .ToList();

        await Task.WhenAll(versionTasks);

        foreach (var task in versionTasks)
        {
            var (version, versionStatisticsResult) = await task;

            if (versionStatisticsResult.IsError)
            {
                await cts.CancelAsync();
                Logger.Error(
                    "Failed to fetch a project version: {VersionId}: {ErrorCode}",
                    version.VersionId,
                    versionStatisticsResult.ErrorCode
                );
                return versionStatisticsResult.ErrorCode!.Value;
            }

            versionTotalTraceCount[version.Name] = versionStatisticsResult.Value.VersionTraceCount;
            versionAxialCodes[version.Name] = versionStatisticsResult.Value.VersionAxialCodes;

            totalTraceCount += versionStatisticsResult.Value.VersionTraceCount;
            totalOpenCodeCount += versionStatisticsResult.Value.VersionOpenCodeCount;
            totalAxialCodeCount += versionStatisticsResult.Value.VersionAxialCodeCount;
        }

        return new GetProjectStatisticsResponse
        {
            TotalTraceCount = totalTraceCount,
            VersionTotalTraceCount = versionTotalTraceCount,
            TotalOpenCodeCount = totalOpenCodeCount,
            TotalAxialCodeCount = totalAxialCodeCount,
            VersionAxialCodes = versionAxialCodes,
        };
    }
}
