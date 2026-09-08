namespace Traces.Features.GetTraceSummaries.Records;

public record TraceMessageView
{
    public required Guid TraceId { get; init; }
    public required string TraceMessageType { get; init; }
    public required int Index { get; init; }
    public required string Role { get; init; }
    public required string Content { get; init; }
}
