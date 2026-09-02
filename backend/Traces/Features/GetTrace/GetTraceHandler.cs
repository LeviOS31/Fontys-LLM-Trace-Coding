using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;
using Traces.Contracts.Features.GetTrace;
using Traces.Data;
using Traces.Data.Models;

namespace Traces.Features.GetTrace;

public class GetTraceHandler : IRequestHandler<GetTraceQuery, Result<GetTraceResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetTraceHandler>();
    private readonly TracesDbContext _tracesDbContext;
    private readonly IMediator _mediator;

    public GetTraceHandler(TracesDbContext tracesDbContext, IMediator mediator)
    {
        _tracesDbContext = tracesDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<GetTraceResponse>> Handle(GetTraceQuery query, CancellationToken cancellationToken)
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
        return await GetTrace(query, cancellationToken);
    }

    private async ValueTask<Result<GetTraceResponse>> GetTrace(GetTraceQuery query, CancellationToken cancellationToken)
    {
        Trace? trace;
        try
        {
            trace = await _tracesDbContext
                .Traces.Include(t => t.TraceCollection)
                .Include(t => t.TraceGroup)
                .Include(t => t.TraceResources)
                .Include(t => t.TraceScopes)
                    .ThenInclude(t => t.TraceScopeSpans)
                        .ThenInclude(t => t.SpanAttributes)
                .Include(t => t.TraceScopes)
                    .ThenInclude(t => t.TraceScopeSpans)
                        .ThenInclude(t => t.SpanEvents)
                            .ThenInclude(t => t.SpanEventAttributes)
                .FirstOrDefaultAsync(
                    t => t.TraceId == query.TraceId && t.TraceCollection.ProjectVersionId == query.ProjectVersionId,
                    cancellationToken
                );
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error retrieving trace {TraceId}", query.TraceId);
            return ErrorCode.DatabaseError;
        }

        if (trace is null)
        {
            Logger.Warning("Trace {TraceId} not found", query.TraceId);
            return ErrorCode.EntityNotFound;
        }

        return new GetTraceResponse
        {
            TraceId = trace.TraceId,
            TraceCollectionId = trace.TraceCollectionId,
            CollectionName = trace.TraceCollection.Name,
            CollectionCreatedAt = trace.TraceCollection.CreatedAt,
            TraceGroupId = trace.TraceGroupId,
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
            // TraceAttributes = trace
            //     .TraceAttributes.Select(a => new TraceAttributeView
            //     {
            //         TraceId = a.TraceId,
            //         Key = a.Key,
            //         Value = a.Value,
            //         TraceAttributeType = a.TraceAttributeType.ToString(),
            //     })
            //     .ToList(),
            // TraceMessages = trace
            //     .TraceMessages.OrderBy(m => m.Index)
            //     .Select(m => new TraceMessageView
            //     {
            //         TraceId = m.TraceId,
            //         TraceMessageType = m.TraceMessageType.ToString(),
            //         Index = m.Index,
            //         Role = m.Role,
            //         Content = m.Content,
            //     })
            //     .ToList(),
        };
    }
}
