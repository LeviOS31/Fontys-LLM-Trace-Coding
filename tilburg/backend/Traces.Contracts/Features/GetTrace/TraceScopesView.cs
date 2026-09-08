namespace Traces.Contracts.Features.GetTrace;

public record TraceScopesView
{
    public required string Name { get; init; }
    public required string Version { get; init; }
    public required IReadOnlyList<TraceScopeSpanView> Spans { get; init; }
}
