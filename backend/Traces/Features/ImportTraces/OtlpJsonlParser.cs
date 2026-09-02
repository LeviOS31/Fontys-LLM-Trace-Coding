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
            Logger.Error(exception, "An error occured while reading the JSONL file");
            return ErrorCode.FileReadError;
        }

        // Convert to the TracesData object
        TracesData[] tracesData;
        try
        {
            tracesData = await ConvertJsonToTracesData(jsonl, cancellationToken);
        }
        catch (Exception exception) when (exception is InvalidJsonException or InvalidProtocolBufferException)
        {
            Logger.Warning(exception, "Uploaded JSONL file containing invalid JSON");
            return ErrorCode.InvalidRequest;
        }
        catch (Exception exception)
        {
            Logger.Error(exception, "An error occured while reading the JSONL file");
            return ErrorCode.FileReadError;
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
            // 1. Decode to JObject
            var jsonObject = serializer.Deserialize<JObject>(reader);
            if (jsonObject == null)
            {
                continue;
            }

            // 2. Convert to JSON string
            var jsonString = jsonObject.ToString();

            // 3. Convert to proto object
            var protoObject = TracesData.Parser.ParseJson(jsonString);
            if (protoObject == null)
            {
                continue;
            }

            traces.Add(protoObject);
        }

        return traces.ToArray();
    }
}
