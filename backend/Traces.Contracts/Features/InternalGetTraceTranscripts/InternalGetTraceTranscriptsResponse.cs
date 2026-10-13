namespace Traces.Contracts.Features.InternalGetTraceTranscripts;

public record InternalGetTraceTranscriptsResponse
{
    public required IEnumerable<TraceTranscriptViewModel> Transcripts { get; init; }
}

public record TraceTranscriptViewModel
{
    public required Guid TraceId { get; init; }
    public required string Transcript { get; init; }
}