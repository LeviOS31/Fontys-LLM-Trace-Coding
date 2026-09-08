namespace Traces.Contracts.Features.GetTrace;

public record SpanEventView
{
    public required ulong TimeUnixNano { get; init; }
    public required string Name { get; init; }
    public ICollection<SpanAttributeView> Attributes { get; init; }
}
