namespace Traces.Contracts.Features.GetTrace;

public record TraceScopeSpanView
{
    public required Guid TraceScopeSpanId { get; init; }
    public Guid? ParentId { get; init; }
    public required string Name { get; init; }
    public required string SpanKind { get; init; }
    public required ulong StartTimeUnixNano { get; init; }
    public required ulong EndTimeUnixNano { get; init; }
    public required IReadOnlyList<SpanAttributeView> Attributes { get; init; }
    public required IReadOnlyList<SpanEventView> Events { get; init; }
}
