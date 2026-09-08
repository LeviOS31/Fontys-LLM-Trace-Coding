using System.Data.Common;
using AxialCodes.Contracts.Features.GetAxialCodes;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;
using Traces.Data;
using Traces.Data.Models;
using Traces.Features.GetTraceSummaries.Records;

namespace Traces.Features.GetTraceSummaries;

public class GetTraceGroupSummaryHandler
    : IRequestHandler<GetTraceGroupSummaryQuery, Result<GetTraceGroupSummaryResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetTraceGroupSummaryHandler>();
    private readonly TracesDbContext _tracesDbContext;
    private readonly IMediator _mediator;

    public GetTraceGroupSummaryHandler(TracesDbContext tracesDbContext, IMediator mediator)
    {
        _tracesDbContext = tracesDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<GetTraceGroupSummaryResponse>> Handle(
        GetTraceGroupSummaryQuery query,
        CancellationToken cancellationToken
    )
    {
        var getProjectQuery = new GetProjectQuery { ProjectId = query.ProjectId, UserId = query.UserId };
        var getProjectResult = await _mediator.Send(getProjectQuery, cancellationToken);

        if (!getProjectResult.IsSuccess)
        {
            Logger.Warning(
                "Failed to retrieve project {ProjectId} for user {UserId}. Error: {ErrorCode}",
                query.ProjectId,
                query.UserId,
                getProjectResult.ErrorCode
            );
            return getProjectResult.ErrorCode;
        }

        return await GetTraceGroupSummaryList(query, cancellationToken);
    }

    private async ValueTask<Result<GetTraceGroupSummaryResponse>> GetTraceGroupSummaryList(
        GetTraceGroupSummaryQuery query,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var dbQuery = _tracesDbContext.TraceGroups.Where(t =>
                t.Traces.Any((trace) => trace.TraceCollection.ProjectVersionId == query.ProjectVersionId)
            );

            // if (query.Filters != null)
            // {
            //     dbQuery = dbQuery.ApplyFilters(query.Filters);
            // }

            var totalCount = await dbQuery.CountAsync(cancellationToken);

            var traceGroups = await dbQuery
                // .OrderBy(group => group.Traces.OrderBy(t => t.TraceCollection.CreatedAt))
                // .ThenBy(group => group.Traces.OrderBy(t => t.TraceId))
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Include(group => group.Traces)
                    .ThenInclude(trace => trace.TraceCollection)
                .Include(group => group.Traces)
                    .ThenInclude(trace => trace.TraceScopes)
                        .ThenInclude(scope => scope.TraceScopeSpans)
                .ToListAsync(cancellationToken);

            var (axialCodesByTrace, axialCreatedAt) = await GetAxialCodeLookup(query, cancellationToken);

            var items = traceGroups
                .Select(group =>
                {
                    var (axialCodeCount, needsAxialUpdate) = SummariseAxialCodes(
                        group,
                        axialCodesByTrace,
                        axialCreatedAt
                    );

                    return new TraceGroupSummaryItem
                    {
                        TraceGroupId = group.TraceGroupId,
                        GroupTitle = group.Traces.FirstOrDefault()?.TraceScopes.FirstOrDefault().Name ?? string.Empty,
                        CollectionName = group.Traces.FirstOrDefault()?.TraceCollection.Name ?? string.Empty,
                        CollectionCreatedAt =
                            group.Traces.FirstOrDefault()?.TraceCollection.CreatedAt ?? DateTime.MinValue,
                        TraceCount = group.Traces.Count,
                        AmountOfSpans = group.Traces.Sum(t => t.TraceScopes.Sum(s => s.TraceScopeSpans.Count)),
                        AmountOfOpenCodes = group.Traces.Sum(t => t.OpenCode != null ? 1 : 0),
                        AmountOfAxialCodes = axialCodeCount,
                        NeedsAxialCodeUpdate = needsAxialUpdate,
                    };
                })
                .ToList();

            return new GetTraceGroupSummaryResponse
            {
                Items = items,
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize,
                HasNextPage = (query.Page * query.PageSize) < totalCount,
            };
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error retrieving trace group summary list for project version {ProjectVersionId}",
                query.ProjectVersionId
            );
            return ErrorCode.DatabaseError;
        }
    }

    /// <summary>
    /// Fetches the version's active axial codes and returns a lookup of trace id to the axial code
    /// ids referencing it, together with the timestamp the axial coding was generated. Degrades to an
    /// empty lookup when there is no active axial coding result so the summary still loads.
    /// </summary>
    private async ValueTask<(Dictionary<Guid, List<Guid>> ByTrace, DateTimeOffset? CreatedAt)> GetAxialCodeLookup(
        GetTraceGroupSummaryQuery query,
        CancellationToken cancellationToken
    )
    {
        var result = await _mediator.Send(
            new GetAxialCodesQuery
            {
                ProjectId = query.ProjectId,
                ProjectVersionId = query.ProjectVersionId,
                UserId = query.UserId,
            },
            cancellationToken
        );

        var byTrace = new Dictionary<Guid, List<Guid>>();
        if (result.IsError || result.Value.AxialCodes is null)
        {
            return (byTrace, null);
        }

        foreach (var axialCode in result.Value.AxialCodes)
        {
            foreach (var traceId in axialCode.TraceIds)
            {
                if (!byTrace.TryGetValue(traceId, out var axialCodeIds))
                {
                    axialCodeIds = [];
                    byTrace[traceId] = axialCodeIds;
                }

                axialCodeIds.Add(axialCode.AxialCodeId);
            }
        }

        return (byTrace, result.Value.CreatedAt);
    }

    /// <summary>
    /// Counts the distinct axial codes touching the group and flags whether any of its open-coded
    /// traces changed after the axial coding was generated (so the axial codes may be stale).
    /// </summary>
    private static (int Count, bool NeedsUpdate) SummariseAxialCodes(
        TraceGroup group,
        IReadOnlyDictionary<Guid, List<Guid>> axialCodesByTrace,
        DateTimeOffset? axialCreatedAt
    )
    {
        var axialCodeIds = new HashSet<Guid>();
        var needsUpdate = false;

        foreach (var trace in group.Traces)
        {
            if (!axialCodesByTrace.TryGetValue(trace.TraceId, out var ids))
            {
                continue;
            }

            axialCodeIds.UnionWith(ids);
            needsUpdate =
                needsUpdate || (axialCreatedAt is not null && trace.UpdatedAt > axialCreatedAt.Value.UtcDateTime);
        }

        return (axialCodeIds.Count, needsUpdate);
    }
}
