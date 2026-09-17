using System.Globalization;
using Mediator;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Proto.Common.V1;
using OpenTelemetry.Proto.Trace.V1;
using Projects.Contracts.Features.GetProject;
using ProjectVersions.Contracts.Features.InternalGetProjectVersions;
using Serilog;
using Shared;
using Traces.Data;
using Traces.Data.Models;
using Traces.Enums;
using Traces.Features.ImportTraces.Parsers;

namespace Traces.Features.ImportTraces;

public class ImportTracesHandler : IRequestHandler<ImportTracesRequest, Result<ImportTracesResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<ImportTracesHandler>();
    private readonly TracesDbContext _tracesDbContext;
    private readonly IMediator _mediator;

    public ImportTracesHandler(TracesDbContext tracesDbContext, IMediator mediator)
    {
        _tracesDbContext = tracesDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<ImportTracesResponse>> Handle(
        ImportTracesRequest request,
        CancellationToken cancellationToken
    )
    {
        //
        // Validate project access
        //
        var getProjectQuery = new GetProjectQuery { ProjectId = request.ProjectId, UserId = request.UserId };
        var getProjectResult = await _mediator.Send(getProjectQuery, cancellationToken);

        if (!getProjectResult.IsSuccess)
        {
            Logger.Warning(
                "Failed to retrieve project {ProjectId} for user {UserId}. Error: {ErrorCode}",
                request.ProjectId,
                request.UserId,
                getProjectResult.ErrorCode
            );
            return getProjectResult.ErrorCode;
        }

        //
        // Validate correct project version
        //
        var getProjectVersionsQuery = new InternalGetProjectVersionsQuery { ProjectId = request.ProjectId };
        var getProjectVersionsResult = await _mediator.Send(getProjectVersionsQuery, cancellationToken);

        if (!getProjectVersionsResult.IsSuccess)
        {
            Logger.Warning(
                "Failed to retrieve project versions for project {ProjectId}. Error: {ErrorCode}",
                request.ProjectId,
                getProjectVersionsResult.ErrorCode
            );
            return getProjectVersionsResult.ErrorCode;
        }

        if (
            getProjectVersionsResult.Value.Versions.Find(version => version.VersionId == request.ProjectVersionId)
            == null
        )
        {
            Logger.Warning(
                "Project version {ProjectVersionId} not found for project {ProjectId}",
                request.ProjectVersionId,
                request.ProjectId
            );
            return ErrorCode.EntityNotFound;
        }

        //
        // Parsing
        //
        var result = await OtlpJsonlParser.Parse(request, cancellationToken);

        if (result.IsError)
        {
            Logger.Warning(
                "Failed to parse uploaded traces for project {ProjectId}, version {ProjectVersionId}. Error: {ErrorCode}",
                request.ProjectId,
                request.ProjectVersionId,
                result.ErrorCode
            );
            return result.ErrorCode;
        }

        await using var transaction = await _tracesDbContext.Database.BeginTransactionAsync(cancellationToken);
        TraceCollection traceCollection;

        try
        {
            traceCollection = await CreateTraceCollection(request, cancellationToken);
            ImportTracesInCollection(result.Value, traceCollection);
            await _tracesDbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            Logger.Error(exception, "Error while saving traces in database");
            return ErrorCode.DatabaseError;
        }

        await transaction.CommitAsync(cancellationToken);

        //
        // Group each related trace
        //
        await GroupTraces(traceCollection, cancellationToken);

        //
        // Finished
        //
        return new ImportTracesResponse
        {
            TraceCollectionId = traceCollection.TraceCollectionId,
            ProjectVersionId = traceCollection.ProjectVersionId,
            Name = traceCollection.Name,
            CreatedAt = traceCollection.CreatedAt,
        };
    }

    private async ValueTask<TraceCollection> CreateTraceCollection(
        ImportTracesRequest request,
        CancellationToken cancellationToken
    )
    {
        var traceCollection = new TraceCollection
        {
            TraceCollectionId = Guid.NewGuid(),
            ProjectVersionId = request.ProjectVersionId,
            Name = request.Name,
            CreatedAt = DateTime.UtcNow,
            Traces = new List<Trace>(),
        };

        _tracesDbContext.TraceCollections.Add(traceCollection);
        await _tracesDbContext.SaveChangesAsync(cancellationToken);

        return traceCollection;
    }

    private void ImportTracesInCollection(TracesData[] tracesData, TraceCollection traceCollection)
    {
        foreach (var traceData in tracesData)
        {
            var trace = new Trace
            {
                TraceId = Guid.NewGuid(),
                TraceCollectionId = traceCollection.TraceCollectionId,
                TraceCollection = traceCollection,
                TraceResources = [],
                TraceScopes = [],
                UpdatedAt = DateTime.UtcNow,
            };
            _tracesDbContext.Traces.Add(trace);

            AddTraceResourceSpans(trace, traceData.ResourceSpans);

            foreach (var resourceSpan in traceData.ResourceSpans)
            {
                foreach (var scopeSpan in resourceSpan.ScopeSpans)
                {
                    AddTraceScope(trace, scopeSpan.Scope, scopeSpan.Spans);
                }
            }
        }
    }

    private void AddTraceResourceSpans(Trace trace, IEnumerable<ResourceSpans> resourceSpans)
    {
        foreach (var resourceAttributes in resourceSpans.SelectMany(x => x.Resource.Attributes))
        {
            var resource = new TraceResource
            {
                TraceId = trace.TraceId,
                Key = resourceAttributes.Key,
                Value = TruncateString(GetAnyValueAsString(resourceAttributes.Value), 32768),
                TraceAttributeType = GetTraceAttributeType(resourceAttributes.Value),
            };

            _tracesDbContext.TraceResources.Add(resource);
        }
    }

    private void AddTraceScope(Trace trace, InstrumentationScope scope, IEnumerable<Span> spans)
    {
        var traceScope = new TraceScope
        {
            TraceScopeId = Guid.NewGuid(),
            TraceId = trace.TraceId,
            Name = scope.Name,
            Version = scope.Version,
        };
        _tracesDbContext.TraceScopes.Add(traceScope);

        var spanIdMap = new Dictionary<string, Guid>();
        var spanList = spans.ToList();

        foreach (var span in spanList)
        {
            var traceSpan = new TraceScopeSpan
            {
                TraceScopeSpanId = Guid.NewGuid(),
                TraceScopeId = traceScope.TraceScopeId,
                Name = span.Name,
                StartTimeUnixNano = span.StartTimeUnixNano,
                EndTimeUnixNano = span.EndTimeUnixNano,
                SpanKind = (SpanKind)span.Kind,
            };

            var spanId = Convert.ToHexString(span.SpanId.Span);
            spanIdMap.Add(spanId, traceSpan.TraceScopeSpanId);
            _tracesDbContext.TraceScopeSpans.Add(traceSpan);

            AddSpanEvents(traceSpan, span.Events);
            AddSpanAttributes(traceSpan, span.Attributes);
        }

        foreach (var span in spanList)
        {
            var parentSpanId = Convert.ToHexString(span.ParentSpanId.Span);

            if (!spanIdMap.TryGetValue(parentSpanId, out var parentId))
                continue;

            var spanId = Convert.ToHexString(span.SpanId.Span);
            var traceSpan = _tracesDbContext.TraceScopeSpans.Local.First(s => s.TraceScopeSpanId == spanIdMap[spanId]);

            traceSpan.ParentSpanId = parentId;
        }
    }

    private void AddSpanEvents(TraceScopeSpan trace, IEnumerable<Span.Types.Event> events)
    {
        foreach (var spanEvent in events)
        {
            var spanEventInDb = new SpanEvent
            {
                EventId = Guid.NewGuid(),
                SpanId = trace.TraceScopeSpanId,
                TimeUnixNano = spanEvent.TimeUnixNano,
                Name = spanEvent.Name,
            };
            _tracesDbContext.SpanEvent.Add(spanEventInDb);

            foreach (var spanEventAttribute in spanEvent.Attributes)
            {
                var spanEventAtributeInDb = new SpanEventAttribute
                {
                    SpanEventId = spanEventInDb.EventId,
                    Key = spanEventAttribute.Key,
                    Value = TruncateString(GetAnyValueAsString(spanEventAttribute.Value), 2560),
                    TraceAttributeType = GetTraceAttributeType(spanEventAttribute.Value),
                };
                _tracesDbContext.SpanEventAttributes.Add(spanEventAtributeInDb);
            }
        }
    }

    private void AddSpanAttributes(TraceScopeSpan traceScopeSpan, IEnumerable<KeyValue> attributes)
    {
        foreach (var spanAttribute in attributes)
        {
            var attribute = new SpanAttribute
            {
                SpanId = traceScopeSpan.TraceScopeSpanId,
                Key = spanAttribute.Key,
                Value = TruncateString(GetAnyValueAsString(spanAttribute.Value), 2560),
                TraceAttributeType = GetTraceAttributeType(spanAttribute.Value),
            };
            _tracesDbContext.SpanAttributes.Add(attribute);
        }
    }

    private static string GetAnyValueAsString(AnyValue value) =>
        value.ValueCase switch
        {
            AnyValue.ValueOneofCase.StringValue => value.StringValue,
            AnyValue.ValueOneofCase.IntValue => value.IntValue.ToString(),
            AnyValue.ValueOneofCase.DoubleValue => value.DoubleValue.ToString(CultureInfo.InvariantCulture),
            AnyValue.ValueOneofCase.BoolValue => value.BoolValue.ToString(),
            _ => "",
        };

    private static string TruncateString(string value, int maxLength)
    {
        if (string.IsNullOrEmpty(value))
            return value;

        return value.Length > maxLength ? value.Substring(0, maxLength) : value;
    }

    private static TraceAttributeType GetTraceAttributeType(AnyValue value) =>
        value.ValueCase switch
        {
            AnyValue.ValueOneofCase.StringValue => value.StringValue.Length > 50 || value.StringValue.Contains('\n')
                ? TraceAttributeType.Text
                : TraceAttributeType.String,
            AnyValue.ValueOneofCase.IntValue => TraceAttributeType.Integer,
            AnyValue.ValueOneofCase.DoubleValue => TraceAttributeType.Integer,
            AnyValue.ValueOneofCase.BoolValue => TraceAttributeType.Boolean,
            _ => TraceAttributeType.String,
        };

    private async Task GroupTraces(TraceCollection traceCollection, CancellationToken cancellationToken)
    {
        // Create a transaction. If something fails while grouping, we're discarding all the group results.
        await using var transaction = await _tracesDbContext.Database.BeginTransactionAsync(cancellationToken);

        // First, get all the traces with only one LLM call (not a full chat history)
        //        those are gen_ai.prompt.[0/1] and nothing with 2 or higher
        // Each trace will be cached locally and assigned a unique group.
        // To have the highest chance of linking the correct traces, every time we're fetching new traces, they are sorted on the start time of the parent trace

        var firstTraces = await FetchTracesWithPromptLimit(traceCollection, 2, cancellationToken); // System and first user prompt

        foreach (var trace in firstTraces)
        {
            var traceGroup = new TraceGroup { TraceGroupId = Guid.NewGuid(), TraceGroupType = TraceGroupType.LlmGroup };
            _tracesDbContext.TraceGroups.Add(traceGroup);

            trace.TraceGroup = traceGroup;
            trace.TraceGroupId = traceGroup.TraceGroupId;
        }

        // Then, we're fetching traces in a loop
        // First, we're looking for gen_ai.prompt.[0/1/2/3] and nothing with 4 or higher
        // Then, in the next iteration, we're adding two more to the index
        // All the way until we can't find any results
        // These results are also sorted on the start time of the parent trace

        var traceIndex = 4;
        var traces = firstTraces;

        while (true) // We're breaking inside when there are no more LLM traces found
        {
            // Inside each trace we're checking here, we're looking at the previous traces
            // From all the matches (if there are multiple) we're grabbing the first one (hence the sorting)
            var tracesThisIteration = await FetchTracesWithPromptLimit(traceCollection, traceIndex, cancellationToken);
            if (tracesThisIteration.Count == 0)
            {
                break;
            }

            foreach (var trace in tracesThisIteration)
            {
                var currentTracePromptAttributes = trace
                    .TraceScopes.SelectMany(scope => scope.TraceScopeSpans)
                    .SelectMany(span => span.SpanAttributes)
                    .Where(attribute =>
                        attribute.Key.StartsWith("gen_ai.prompt.")
                        && (attribute.Key.EndsWith(".role") || attribute.Key.EndsWith(".content"))
                    )
                    .OrderBy(attribute => attribute.Key)
                    .ToList();

                // Matching: all the prompts should be EXACTLY the same
                //           the completion of the previous one should be in the same
                var matchingParentTrace = traces.Find(prevTrace =>
                {
                    // Matching the prompts
                    var promptAttributes = (prevTrace.TraceScopes ?? [])
                        .Where(scope => scope.TraceScopeSpans != null)
                        .SelectMany(scope => scope.TraceScopeSpans)
                        .Where(span => span.SpanAttributes != null)
                        .SelectMany(span => span.SpanAttributes)
                        .Where(attribute =>
                            attribute.Key.StartsWith("gen_ai.prompt.")
                            && (attribute.Key.EndsWith(".role") || attribute.Key.EndsWith(".content"))
                        )
                        .OrderBy(attribute => attribute.Key)
                        .ToList();

                    for (var i = 0; i < traceIndex - 2; i++)
                    {
                        // gen_ai.prompt.i.role and gen_ai.prompt.i.content should have the same value as 'trace'
                        var promptRole = promptAttributes
                            .Find(attribute => attribute.Key.Equals($"gen_ai.prompt.{i}.role"))
                            ?.Value;
                        var traceRole = currentTracePromptAttributes
                            .Find(attribute => attribute.Key.Equals($"gen_ai.prompt.{i}.role"))
                            ?.Value;
                        if (promptRole == null || traceRole == null || !promptRole.Equals(traceRole))
                            return false;

                        var promptContent = promptAttributes
                            .Find(attribute => attribute.Key.Equals($"gen_ai.prompt.{i}.content"))
                            ?.Value;
                        var traceContent = currentTracePromptAttributes
                            .Find(attribute => attribute.Key.Equals($"gen_ai.prompt.{i}.content"))
                            ?.Value;
                        if (promptContent == null || traceContent == null || !promptContent.Equals(traceContent))
                            return false;
                    }

                    // Next: the completion of the previous trace should be the same as prompt traceIndex-1 in the current trace
                    var completionAttributes = prevTrace
                        .TraceScopes.SelectMany(scope => scope.TraceScopeSpans)
                        .SelectMany(span => span.SpanAttributes)
                        .Where(attribute =>
                            attribute.Key.StartsWith("gen_ai.completion.")
                            && (attribute.Key.EndsWith(".role") || attribute.Key.EndsWith(".content"))
                        )
                        .OrderBy(attribute => attribute.Key)
                        .ToList();

                    var completionRole = completionAttributes
                        .Find(attribute => attribute.Key.Equals("gen_ai.completion.0.role"))
                        ?.Value;
                    var tracePromptRole = currentTracePromptAttributes
                        .Find(attribute => attribute.Key.Equals($"gen_ai.prompt.{traceIndex - 2}.role"))
                        ?.Value;
                    if (completionRole == null || tracePromptRole == null || !completionRole.Equals(tracePromptRole))
                        return false;

                    var completionContent = completionAttributes
                        .Find(attribute => attribute.Key.Equals("gen_ai.completion.0.content"))
                        ?.Value;
                    var tracePromptContent = currentTracePromptAttributes
                        .Find(attribute => attribute.Key.Equals($"gen_ai.prompt.{traceIndex - 2}.content"))
                        ?.Value;
                    if (
                        completionContent == null
                        || tracePromptContent == null
                        || !completionContent.Equals(tracePromptContent)
                    )
                        return false;

                    // We found it :-)
                    return true;
                });
                if (matchingParentTrace == null)
                    continue;

                trace.TraceGroupId = matchingParentTrace.TraceGroupId;
                trace.TraceGroup = matchingParentTrace.TraceGroup;
                _tracesDbContext.Traces.Update(trace);
            }

            // Done for this iteration, prepare for the next one
            traceIndex += 2;
            traces = tracesThisIteration;
        }

        // Done with the first part. Commit the changes, after that we're looking into the traces that don't have a group.
        await _tracesDbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        // Then we're adding the type LlmGroup to every trace in this collection, each trace a unique group
        var llmTracesWithoutGroups = await _tracesDbContext
            .Traces.Where(trace => trace.TraceCollectionId == traceCollection.TraceCollectionId)
            .Where(trace => trace.TraceGroupId == null)
            .Where(trace =>
                trace.TraceScopes.Any(scope =>
                    scope.TraceScopeSpans.Any(span =>
                        span.SpanAttributes.Any(attribute =>
                            attribute.Key.StartsWith("gen_ai.prompt.")
                            && (attribute.Key.EndsWith(".role") || attribute.Key.EndsWith(".content"))
                        )
                    )
                )
            )
            .ToListAsync(cancellationToken);

        foreach (var trace in llmTracesWithoutGroups)
        {
            var group = new TraceGroup { TraceGroupId = Guid.NewGuid(), TraceGroupType = TraceGroupType.LlmGroup };
            _tracesDbContext.TraceGroups.Add(group);

            trace.TraceGroup = group;
            trace.TraceGroupId = group.TraceGroupId;
        }

        // Update the DB
        await _tracesDbContext.SaveChangesAsync(cancellationToken);

        // Finally, everything that still doesn't have a group in this collection will have a unique group with OtherGroup type
        var finalTracesWithoutGroups = await _tracesDbContext
            .Traces.Where(trace => trace.TraceCollectionId == traceCollection.TraceCollectionId)
            .Where(trace => trace.TraceGroupId == null)
            .ToListAsync(cancellationToken);

        foreach (var trace in finalTracesWithoutGroups)
        {
            var group = new TraceGroup { TraceGroupId = Guid.NewGuid(), TraceGroupType = TraceGroupType.OtherGroup };
            _tracesDbContext.TraceGroups.Add(group);

            trace.TraceGroup = group;
            trace.TraceGroupId = group.TraceGroupId;
        }

        // Update the DB
        await _tracesDbContext.SaveChangesAsync(cancellationToken);
    }

    private Task<List<Trace>> FetchTracesWithPromptLimit(
        TraceCollection traceCollection,
        int promptLimit,
        CancellationToken cancellationToken
    )
    {
        // PromptLimit should be an even number
        if (promptLimit % 2 == 1)
        {
            throw new ArgumentException(
                "Prompt limit should be an even number, representing the number of prompt and completion pairs to look for."
            );
        }

        return _tracesDbContext
            .Traces.Where(trace => trace.TraceCollectionId == traceCollection.TraceCollectionId)
            .Include(trace => trace.TraceScopes)
                .ThenInclude(scope => scope.TraceScopeSpans)
                    .ThenInclude(span => span.SpanAttributes)
            .Where(trace =>
                trace.TraceScopes.Any(scope =>
                    scope.TraceScopeSpans.Any(span =>
                        span.SpanAttributes.Count(attribute =>
                            attribute.Key.StartsWith("gen_ai.prompt.")
                            && (attribute.Key.EndsWith(".role") || attribute.Key.EndsWith(".content"))
                        )
                        == promptLimit * 2
                    )
                )
            )
            .OrderBy(trace =>
                trace.TraceScopes.SelectMany(scope => scope.TraceScopeSpans).Min(span => span.StartTimeUnixNano)
            )
            .ToListAsync(cancellationToken);
    }
}
