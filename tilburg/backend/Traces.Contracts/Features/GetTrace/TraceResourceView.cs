using Traces.Enums;

namespace Traces.Contracts.Features.GetTrace;

public record TraceResourceView
{
    public required string Key { get; init; }
    public required string Value { get; init; }
    public required TraceAttributeType TraceAttributeType { get; init; }
}
