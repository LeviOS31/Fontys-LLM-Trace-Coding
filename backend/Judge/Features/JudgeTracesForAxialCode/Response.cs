namespace Judge.Features.JudgeTracesForAxialCode;

public record JudgeTracesForAxialCodeResponse
{
    public required Guid JudgeCollectionId { get; init; }
    public required IEnumerable<IEnumerable<TraceJudgeResultViewModel>> Results { get; init; }
}

public record TraceJudgeResultViewModel
{
    public required Guid TraceId { get; init; }
    public required Guid JudgeTemplateId { get; init; }
    public required string Status { get; init; } // "Success" | "Error"
    public string? Verdict { get; init; } // "True" | "False", null when Status is "Error"
    public string? Reasoning { get; init; }
    public string? Error { get; init; }
    public bool JudgingTrace { get; init; } // true if the trace is judged, false if raw LLM data is judged
}