namespace Traces.Features.GetTraceSummaries.Records;

public record TraceAttributeView
{
    public required Guid TraceId { get; init; }
    public required string Key { get; init; }
    public required string Value { get; init; }
    public required string TraceAttributeType { get; init; }
}
