using System.Data.Common;
using System.Text;
using System.Text.RegularExpressions;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;
using Traces.Contracts.Features.InternalGetTraceTranscripts;
using Traces.Data;

namespace Traces.Features.InternalGetTraceTranscripts;

public partial class InternalGetTraceTranscriptsHandler
    : IRequestHandler<
        InternalGetTraceTranscriptsRequest,
        Result<InternalGetTraceTranscriptsResponse>
    >
{
    private static readonly ILogger Logger =
        Log.ForContext<InternalGetTraceTranscriptsHandler>();

    private readonly TracesDbContext _dbContext;

    public InternalGetTraceTranscriptsHandler(TracesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async ValueTask<Result<InternalGetTraceTranscriptsResponse>> Handle(
        InternalGetTraceTranscriptsRequest request,
        CancellationToken cancellationToken
    )
    {
        List<Data.Models.Trace> traces;

        try
        {
            var tracesQuery = _dbContext.Traces
                .Where(t =>
                    t.TraceCollection.ProjectVersionId
                    == request.ProjectVersionId
                );

            if (request.TraceCollectionId.HasValue)
            {
                tracesQuery = tracesQuery.Where(t =>
                    t.TraceCollectionId
                    == request.TraceCollectionId.Value
                );
            }

            if (request.TraceId.HasValue)
            {
                tracesQuery = tracesQuery.Where(t =>
                    t.TraceId == request.TraceId.Value
                );
            }

            traces = await tracesQuery
                .Include(t => t.TraceScopes)
                    .ThenInclude(s => s.TraceScopeSpans)
                        .ThenInclude(span => span.SpanAttributes)
                .ToListAsync(cancellationToken);
        }
        catch (
            Exception ex
        ) when (
            ex is DbUpdateException
            or DbException
            or InvalidOperationException
        )
        {
            Logger.Error(
                ex,
                "Error retrieving trace transcripts for version {ProjectVersionId}",
                request.ProjectVersionId
            );

            return ErrorCode.DatabaseError;
        }

        var transcripts = traces.Select(trace =>
            new TraceTranscriptViewModel
            {
                TraceId = trace.TraceId,
                Transcript = BuildTranscript(trace),
            }
        );

        return new InternalGetTraceTranscriptsResponse
        {
            Transcripts = transcripts
        };
    }

    private static string BuildTranscript(Data.Models.Trace trace)
    {
        var spans = trace
            .TraceScopes
            .SelectMany(s => s.TraceScopeSpans)
            .OrderBy(span => span.StartTimeUnixNano)
            .ToList();

        var messages = new List<(string Role, string Content)>();

        foreach (var span in spans)
        {
            var promptRoles = new Dictionary<int, string>();
            var promptContents = new Dictionary<int, string>();
            var completionRoles = new Dictionary<int, string>();
            var completionContents = new Dictionary<int, string>();

            foreach (var attr in span.SpanAttributes)
            {
                var match = GenAiAttributeRegex().Match(attr.Key);

                if (!match.Success)
                {
                    continue;
                }

                var kind = match.Groups["kind"].Value;
                var index = int.Parse(match.Groups["index"].Value);
                var field = match.Groups["field"].Value;
                var value = attr.Value ?? "";

                var rolesDict = kind == "prompt"
                    ? promptRoles
                    : completionRoles;

                var contentsDict = kind == "prompt"
                    ? promptContents
                    : completionContents;

                if (field == "role")
                {
                    rolesDict[index] = value;
                }
                else if (field == "content")
                {
                    contentsDict[index] = value;
                }
            }

            foreach (var index in promptContents.Keys.OrderBy(i => i))
            {
                var role = promptRoles.GetValueOrDefault(index, "unknown");
                var content = promptContents[index];

                if (messages.Count == 0 || messages[^1] != (role, content))
                {
                    messages.Add((role, content));
                }
            }

            foreach (var index in completionContents.Keys.OrderBy(i => i))
            {
                var role = completionRoles.GetValueOrDefault(index, "assistant");
                var content = completionContents[index];

                if (messages.Count == 0 || messages[^1] != (role, content))
                {
                    messages.Add((role, content));
                }
            }
        }

        var sb = new StringBuilder();

        foreach (var (role, content) in messages)
        {
            sb.AppendLine($"{role.ToUpperInvariant()}: {content}");
            sb.AppendLine();
        }

        return sb.ToString().Trim();
    }

    [GeneratedRegex(
        @"^gen_ai\.(?<kind>prompt|completion)\.(?<index>\d+)\.(?<field>role|content)$"
    )]
    private static partial Regex GenAiAttributeRegex();
}