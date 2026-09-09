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
    /// Parses a JSONL string into an array of <see cref="TracesData"/> proto objects.
    /// Each line is expected to be a valid JSON object representing a single trace.
    /// </summary>
    /// <param name="jsonl">The JSONL string to parse.</param>
    /// <param name="cancellationToken">Token to cancel the async operation.</param>
    /// <returns>An array of deserialized <see cref="TracesData"/> instances.</returns>
    private static async ValueTask<TracesData[]> ConvertJsonToTracesData(
        string jsonl,
        CancellationToken cancellationToken
    )
    {
        await using var reader = new JsonTextReader(new StringReader(jsonl));
        reader.SupportMultipleContent = true;

        var serializer = JsonSerializer.Create();
        var traces = new List<TracesData>();

        while (await reader.ReadAsync(cancellationToken))
        {
            var jsonValue = JToken.Load(reader);

            if (jsonValue is JArray jsonArray)
            {
                var arrayTraces = new List<TracesData>();
                foreach (var item in jsonArray.OfType<JObject>())
                {
                    AddTrace(item, arrayTraces);
                }

                traces.AddRange(MergeArrayTraces(arrayTraces));
            }
            else if (jsonValue is JObject jsonObject)
            {
                AddTrace(jsonObject, traces);
            }
        }

        return traces.ToArray();
    }

    private static void AddTrace(JObject jsonObject, ICollection<TracesData> traces)
    {
        var protoObject = TracesData.Parser.ParseJson(jsonObject.ToString());
        if (protoObject != null)
        {
            traces.Add(protoObject);
        }
    }

    private static IEnumerable<TracesData> MergeArrayTraces(IEnumerable<TracesData> input)
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
