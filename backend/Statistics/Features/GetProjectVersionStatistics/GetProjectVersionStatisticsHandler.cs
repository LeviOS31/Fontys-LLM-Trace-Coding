using AxialCodes.Contracts.Features.GetAxialCodes;
using Mediator;
using Microsoft.Extensions.DependencyInjection;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;
using Statistics.Features.Shared;
using Traces.Contracts.Features.GetTracesCount;
using Traces.Contracts.Features.GetVersionOpencode;

namespace Statistics.Features.GetProjectVersionStatistics;

public class GetProjectVersionStatisticsHandler
    : IRequestHandler<GetProjectVersionStatisticsQuery, Result<GetProjectVersionStatisticsResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetProjectVersionStatisticsHandler>();
    private readonly IMediator _mediator;
    private readonly IServiceScopeFactory _scopeFactory;

    public GetProjectVersionStatisticsHandler(IMediator mediator, IServiceScopeFactory scopeFactory)
    {
        _mediator = mediator;
        _scopeFactory = scopeFactory;
    }

    public async ValueTask<Result<GetProjectVersionStatisticsResponse>> Handle(
        GetProjectVersionStatisticsQuery query,
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

        // Validate if version exist under project
        if (projectResult.Value.Versions.Find(v => v.VersionId == query.VersionId) == null)
            return ErrorCode.InvalidRequest;

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

        var traceCountTask = Task.Run(
            async () =>
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                return await mediator.Send(
                    new GetTracesCountQuery { ProjectId = query.ProjectId, ProjectVersionId = query.VersionId },
                    cts.Token
                );
            },
            cts.Token
        );

        var openCodesTask = Task.Run(
            async () =>
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                return await mediator.Send(
                    new GetVersionOpencodeQuery
                    {
                        ProjectId = query.ProjectId,
                        ProjectVersionId = query.VersionId,
                        UserId = query.UserId,
                    },
                    cts.Token
                );
            },
            cts.Token
        );

        var axialCodesTask = Task.Run(
            async () =>
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                return await mediator.Send(
                    new GetAxialCodesQuery
                    {
                        ProjectId = query.ProjectId,
                        ProjectVersionId = query.VersionId,
                        UserId = query.UserId,
                    },
                    cts.Token
                );
            },
            cts.Token
        );

        await Task.WhenAll(traceCountTask, openCodesTask, axialCodesTask);

        var traceCountResult = await traceCountTask;
        var openCodesResult = await openCodesTask;
        var axialCodesResult = await axialCodesTask;

        if (traceCountResult.IsError)
        {
            Logger.Error(
                "Failed to fetch trace count for project {ProjectId} version {VersionId}: {ErrorCode}",
                query.ProjectId,
                query.VersionId,
                traceCountResult.ErrorCode
            );
            return traceCountResult.ErrorCode!.Value;
        }

        if (openCodesResult.IsError)
        {
            Logger.Error(
                "Failed to fetch open codes for project {ProjectId} version {VersionId}: {ErrorCode}",
                query.ProjectId,
                query.VersionId,
                openCodesResult.ErrorCode
            );
            return openCodesResult.ErrorCode!.Value;
        }

        if (axialCodesResult.IsError)
        {
            Logger.Error(
                "Failed to fetch axial codes for project {ProjectId} version {VersionId}: {ErrorCode}",
                query.ProjectId,
                query.VersionId,
                axialCodesResult.ErrorCode
            );
            return axialCodesResult.ErrorCode!.Value;
        }

        var axialCodes =
            axialCodesResult
                .Value.AxialCodes?.Select(code => new AxialCodeReturnItem
                {
                    Label = code.Label,
                    Description = code.Description,
                    OpenCodeCount = code.TraceIds.Count,
                })
                .ToList()
            ?? [];

        return new GetProjectVersionStatisticsResponse
        {
            VersionTraceCount = traceCountResult.Value.TotalCount,
            VersionOpenCodeCount = openCodesResult.Value.Opencodes.Count(),
            VersionAxialCodeCount = axialCodes.Count,
            VersionAxialCodes = axialCodes,
        };
    }
}
