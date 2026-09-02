using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;
using Traces.Contracts.Features.GetTrace;
using Traces.Data;
using Traces.Data.Models;
using Traces.Enums;

namespace Traces.Features.GetTraceGroup;

public class GetTraceGroupHandler : IRequestHandler<GetTraceGroupQuery, Result<GetTraceGroupResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetTraceGroupHandler>();
    private readonly TracesDbContext _tracesDbContext;
    private readonly IMediator _mediator;

    public GetTraceGroupHandler(TracesDbContext tracesDbContext, IMediator mediator)
    {
        _tracesDbContext = tracesDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<GetTraceGroupResponse>> Handle(
        GetTraceGroupQuery query,
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

        return await GetTraceGroup(query, cancellationToken);
    }

    private async ValueTask<Result<GetTraceGroupResponse>> GetTraceGroup(
        GetTraceGroupQuery query,
        CancellationToken cancellationToken
    )
    {
        TraceGroup? traceGroup;
        try
        {
            traceGroup = await _tracesDbContext
                .TraceGroups.Include(g => g.Traces)
                    .ThenInclude(t => t.TraceCollection)
                .Include(g => g.Traces)
                    .ThenInclude(t => t.TraceResources)
                .Include(g => g.Traces)
                    .ThenInclude(t => t.TraceScopes)
                        .ThenInclude(s => s.TraceScopeSpans)
                            .ThenInclude(span => span.SpanAttributes)
                .Include(g => g.Traces)
                    .ThenInclude(t => t.TraceScopes)
                        .ThenInclude(s => s.TraceScopeSpans)
                            .ThenInclude(span => span.SpanEvents)
                                .ThenInclude(e => e.SpanEventAttributes)
                .FirstOrDefaultAsync(
                    g =>
                        g.TraceGroupId == query.TraceGroupId
                        && g.Traces.Any(t => t.TraceCollection.ProjectVersionId == query.ProjectVersionId),
                    cancellationToken
                );
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error retrieving trace group {TraceGroupId}", query.TraceGroupId);
            return ErrorCode.DatabaseError;
        }

        if (traceGroup is null)
        {
            Logger.Warning("Trace group {TraceGroupId} not found", query.TraceGroupId);
            return ErrorCode.EntityNotFound;
        }

        return new GetTraceGroupResponse
        {
            TraceGroupId = traceGroup.TraceGroupId,
            TraceGroupType = traceGroup.TraceGroupType.ToString(),
            Traces = traceGroup
                .Traces.Where(t => t.TraceCollection.ProjectVersionId == query.ProjectVersionId)
                .Select(trace => new TraceDetailView
                {
                    TraceId = trace.TraceId,
                    TraceCollectionId = trace.TraceCollectionId,
                    CollectionName = trace.TraceCollection.Name,
                    CollectionCreatedAt = trace.TraceCollection.CreatedAt,
                    OpenCode = trace.OpenCode,
                    UpdatedAt = trace.UpdatedAt,
                    TraceResources = trace
                        .TraceResources.Select(r => new TraceResourceView
                        {
                            Key = r.Key,
                            Value = r.Value,
                            TraceAttributeType = r.TraceAttributeType,
                        })
                        .ToList(),
                    TraceScopes = trace
                        .TraceScopes.Select(s => new TraceScopesView
                        {
                            Name = s.Name,
                            Version = s.Version,
                            Spans = s
                                .TraceScopeSpans.Select(span => new TraceScopeSpanView
                                {
                                    TraceScopeSpanId = span.TraceScopeSpanId,
                                    ParentId = span.ParentSpanId,
                                    Name = span.Name,
                                    StartTimeUnixNano = span.StartTimeUnixNano,
                                    EndTimeUnixNano = span.EndTimeUnixNano,
                                    SpanKind = span.SpanKind.ToString(),
                                    Attributes = span
                                        .SpanAttributes.Select(attribute => new SpanAttributeView
                                        {
                                            Key = attribute.Key,
                                            Value = attribute.Value,
                                            TraceAttributeType = attribute.TraceAttributeType,
                                        })
                                        .ToList(),
                                    Events = span
                                        .SpanEvents.Select(spanEvent => new SpanEventView
                                        {
                                            TimeUnixNano = spanEvent.TimeUnixNano,
                                            Name = spanEvent.Name,
                                            Attributes = spanEvent
                                                .SpanEventAttributes.Select(e => new SpanAttributeView
                                                {
                                                    Key = e.Key,
                                                    Value = e.Value,
                                                    TraceAttributeType = e.TraceAttributeType,
                                                })
                                                .ToList(),
                                        })
                                        .ToList(),
                                })
                                .ToList(),
                        })
                        .ToList(),
                })
                .OrderBy(trace =>
                    trace.TraceScopes.SelectMany(scope => scope.Spans).Min(span => span.StartTimeUnixNano)
                )
                .ToList(),
        };
    }
}
