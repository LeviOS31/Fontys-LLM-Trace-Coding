using System.Text.Encodings.Web;
using System.Text.Json;
using OpenTelemetry.Proto.Common.V1;
using OpenTelemetry.Proto.Trace.V1;
using Serilog;
using ProtoSpan = OpenTelemetry.Proto.Trace.V1.Span;

namespace Traces.Features.ImportTraces.Parsers;

/// <summary>
/// One message of an LLM conversation, independent of the convention it was recorded in.
/// </summary>
internal sealed record GenAiMessage(string Role, string Content);

internal sealed record GenAiExtraction(IReadOnlyList<GenAiMessage> Input, IReadOnlyList<GenAiMessage> Output);

/// <summary>
/// Maps one attribute convention for LLM input/output onto <see cref="GenAiExtraction"/>.
/// Mappings only look at attributes, never at span names.
/// </summary>
internal interface IGenAiConventionMapping
{
    string Name { get; }

    bool TryExtract(IReadOnlyDictionary<string, string> attributes, out GenAiExtraction extraction);
}

internal static class GenAiRoles
{
    /// <summary>Returns the lower-case role when it is one the application can display, otherwise null.</summary>
    public static string? Normalize(string? role)
    {
        var normalized = role?.Trim().ToLowerInvariant();
        return normalized is "user" or "assistant" or "system" ? normalized : null;
    }
}

/// <summary>
/// Older OpenLLMetry (Traceloop) layout: gen_ai.prompt.N.role / .content and
/// gen_ai.completion.0.role / .content. Only the first completion is read.
/// Messages with a role the application cannot display (e.g. tool) are skipped.
/// </summary>
internal sealed class LegacyIndexedMapping : IGenAiConventionMapping
{
    public string Name => "legacy-indexed";

    public bool TryExtract(IReadOnlyDictionary<string, string> attributes, out GenAiExtraction extraction)
    {
        var input = new List<GenAiMessage>();
        for (var i = 0; ; i++)
        {
            if (
                !attributes.TryGetValue($"gen_ai.prompt.{i}.role", out var role)
                || !attributes.TryGetValue($"gen_ai.prompt.{i}.content", out var content)
            )
            {
                break;
            }

            var normalizedRole = GenAiRoles.Normalize(role);
            if (normalizedRole != null)
            {
                input.Add(new GenAiMessage(normalizedRole, content));
            }
        }

        var output = new List<GenAiMessage>();
        if (
            attributes.TryGetValue("gen_ai.completion.0.role", out var completionRole)
            && attributes.TryGetValue("gen_ai.completion.0.content", out var completionContent)
            && GenAiRoles.Normalize(completionRole) is { } normalizedCompletionRole
        )
        {
            output.Add(new GenAiMessage(normalizedCompletionRole, completionContent));
        }

        extraction = new GenAiExtraction(input, output);
        return input.Count > 0 || output.Count > 0;
    }
}

/// <summary>
/// Rewrites LLM input/output recorded in a supported legacy convention into the OpenTelemetry GenAI
/// convention (gen_ai.input.messages / gen_ai.output.messages, JSON strings with text parts), so the
/// rest of the application only has to understand that one convention.
/// The conversion is additive: the original attributes are kept, and the convention they were
/// converted from is recorded in <see cref="SourceConventionKey"/>.
/// Spans that already use the OpenTelemetry convention are left untouched.
/// </summary>
internal static class GenAiMessageNormalizer
{
    public const string InputMessagesKey = "gen_ai.input.messages";
    public const string OutputMessagesKey = "gen_ai.output.messages";
    public const string SystemInstructionsKey = "gen_ai.system_instructions";
    public const string SourceConventionKey = "import.gen_ai.source_convention";

    private static readonly ILogger Logger = Log.ForContext(typeof(GenAiMessageNormalizer));

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    // Tried in order, the first mapping that finds messages wins.
    // Supporting a new convention means adding a mapping here.
    private static readonly IGenAiConventionMapping[] Mappings = [new LegacyIndexedMapping()];

    /// <returns>The number of spans that were converted.</returns>
    public static int Normalize(IEnumerable<TracesData> traces)
    {
        var converted = 0;
        var spans = traces
            .SelectMany(trace => trace.ResourceSpans)
            .SelectMany(resourceSpans => resourceSpans.ScopeSpans)
            .SelectMany(scopeSpans => scopeSpans.Spans);

        foreach (var span in spans)
        {
            try
            {
                if (NormalizeSpan(span))
                {
                    converted++;
                }
            }
            catch (Exception exception)
            {
                // A span with unexpected content must not fail the whole import.
                Logger.Warning(exception, "Could not normalize GenAI messages of a span, keeping it as it is");
            }
        }

        return converted;
    }

    internal static bool NormalizeSpan(ProtoSpan span)
    {
        if (span.Attributes.Any(attribute => IsCanonicalKey(attribute.Key)))
        {
            return false;
        }

        var attributes = new Dictionary<string, string>();
        foreach (var attribute in span.Attributes)
        {
            if (attribute.Value?.ValueCase == AnyValue.ValueOneofCase.StringValue)
            {
                attributes.TryAdd(attribute.Key, attribute.Value.StringValue);
            }
        }

        foreach (var mapping in Mappings)
        {
            if (!mapping.TryExtract(attributes, out var extraction))
            {
                continue;
            }

            if (extraction.Input.Count > 0)
            {
                span.Attributes.Add(StringAttribute(InputMessagesKey, ToOtelJson(extraction.Input)));
            }
            if (extraction.Output.Count > 0)
            {
                span.Attributes.Add(StringAttribute(OutputMessagesKey, ToOtelJson(extraction.Output)));
            }
            span.Attributes.Add(StringAttribute(SourceConventionKey, mapping.Name));
            return true;
        }

        return false;
    }

    private static bool IsCanonicalKey(string key) =>
        key is InputMessagesKey or OutputMessagesKey or SystemInstructionsKey;

    // [{ "role": "user", "parts": [{ "type": "text", "content": "..." }] }]
    // finish_reason is not added to output messages because the legacy convention does not record it.
    private static string ToOtelJson(IEnumerable<GenAiMessage> messages) =>
        JsonSerializer.Serialize(
            messages.Select(message => new
            {
                role = message.Role,
                parts = new[] { new { type = "text", content = message.Content } },
            }),
            JsonOptions
        );

    private static KeyValue StringAttribute(string key, string value) =>
        new() { Key = key, Value = new AnyValue { StringValue = value } };
}