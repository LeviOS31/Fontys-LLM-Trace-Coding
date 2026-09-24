using Google.Protobuf;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OpenTelemetry.Proto.Trace.V1;
using Serilog;
using Shared;

namespace Traces.Features.ImportTraces.Parsers;

public class OtlpJsonlParser
{
    private static readonly ILogger Logger = Log.ForContext<OtlpJsonlParser>();

    public static async ValueTask<Result<TracesData[]>> Parse(
        ImportTracesRequest request,
        CancellationToken cancellationToken
    )
    {
        // Get the JSONL from the uploaded file
        string jsonl;
        try
        {
            jsonl = await ReadFile(request.File, cancellationToken);
        }
        catch (Exception exception) when (exception is IOException or InvalidOperationException)
        {
            Logger.Error(exception, "An error occurred while processing the uploaded trace file");
            return ErrorCode.InvalidRequest;
        }

        // Convert to the TracesData object
        TracesData[] tracesData;
        try
        {
            tracesData = await ConvertJsonToTracesData(jsonl, cancellationToken);
        }
        catch (Exception exception) when (
            exception is InvalidJsonException or InvalidProtocolBufferException or JsonReaderException
        )
        {
            Logger.Warning(exception, "Uploaded JSONL file containing invalid JSON");
            return ErrorCode.InvalidRequest;
        }
        catch (Exception exception)
        {
            Logger.Error(exception, "An error occurred while processing the uploaded trace file");
            return ErrorCode.InvalidRequest;
        }

        return tracesData;
    }

    /// <summary>
    /// Reads the full content of an uploaded form file as a UTF-8 string.
    /// </summary>
    /// <param name="file">The form file to read.</param>
    /// <param name="cancellationToken">Token to cancel the async operation.</param>
    /// <returns>The file contents as a string.</returns>
    private static async ValueTask<string> ReadFile(IFormFile file, CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(file.OpenReadStream());
        return await reader.ReadToEndAsync(cancellationToken);
    }

    /// <summary>
    /// Parses a string into an array of <see cref="TracesData"/> proto objects.
    /// Accepts either JSONL (one JSON object per line, or several concatenated JSON
    /// values), a single JSON array of trace objects, or a mix of both across the file.
    /// Spans that share a <c>traceId</c> are always merged into a single
    /// <see cref="TracesData"/>, regardless of whether they originated from the same
    /// top-level JSON value or different ones (e.g. batched OTLP exports where a trace's
    /// spans are split across multiple lines/objects).
    /// </summary>
    /// <param name="jsonl">The JSON/JSONL string to parse.</param>
    /// <param name="cancellationToken">Token to cancel the async operation.</param>
    /// <returns>An array of deserialized, traceId-merged <see cref="TracesData"/> instances.</returns>
    private static async ValueTask<TracesData[]> ConvertJsonToTracesData(
        string jsonl,
        CancellationToken cancellationToken
    )
    {
        await using var reader = new JsonTextReader(new StringReader(jsonl));
        reader.SupportMultipleContent = true;

        // Collect every parsed trace object first, from every top-level JSON value in
        // the file (whether that value was a bare object or an array of objects).
        // Merging happens once, globally, at the end — see MergeTracesById below.
        var traces = new List<TracesData>();

        while (await reader.ReadAsync(cancellationToken))
        {
            var jsonValue = JToken.Load(reader);

            if (jsonValue is JArray jsonArray)
            {
                foreach (var item in jsonArray.OfType<JObject>())
                {
                    AddTrace(item, traces);
                }
            }
            else if (jsonValue is JObject jsonObject)
            {
                AddTrace(jsonObject, traces);
            }
        }

        return MergeTracesById(traces).ToArray();
    }

    private static void AddTrace(JObject jsonObject, ICollection<TracesData> traces)
    {
        var protoObject = TracesData.Parser.ParseJson(jsonObject.ToString());
        if (protoObject != null)
        {
            traces.Add(protoObject);
        }
    }

    /// <summary>
    /// Merges spans from every parsed <see cref="TracesData"/> that share the same
    /// <c>traceId</c> into a single <see cref="TracesData"/>, so a trace whose spans were
    /// split across multiple top-level JSON documents (lines, batches, or array entries)
    /// is reassembled into one complete span tree.
    /// </summary>
    private static IEnumerable<TracesData> MergeTracesById(IEnumerable<TracesData> input)
    {
        var tracesById = new Dictionary<string, TracesData>(StringComparer.OrdinalIgnoreCase);

        foreach (var traceData in input)
        {
            foreach (var resourceSpans in traceData.ResourceSpans)
            {
                foreach (var scopeSpans in resourceSpans.ScopeSpans)
                {
                    foreach (var span in scopeSpans.Spans)
                    {
                        var traceId = Convert.ToHexString(span.TraceId.Span);
                        if (!tracesById.TryGetValue(traceId, out var mergedTrace))
                        {
                            mergedTrace = new TracesData();
                            var mergedResourceSpans = new ResourceSpans();
                            if (resourceSpans.Resource != null)
                            {
                                mergedResourceSpans.Resource = resourceSpans.Resource.Clone();
                            }

                            mergedTrace.ResourceSpans.Add(mergedResourceSpans);
                            tracesById.Add(traceId, mergedTrace);
                        }

                        var mergedScopeSpans = new ScopeSpans
                        {
                            Scope = scopeSpans.Scope?.Clone(),
                        };
                        mergedScopeSpans.Spans.Add(span.Clone());
                        mergedTrace.ResourceSpans[0].ScopeSpans.Add(mergedScopeSpans);
                    }
                }
            }
        }

        return tracesById.Values;
    }
}