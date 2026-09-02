namespace Traces.Contracts.Features.GetVersionOpencode;

public record GetVersionOpencodeResponse
{
    public required IEnumerable<OpencodeViewModel> Opencodes { get; init; }

    public record OpencodeViewModel
    {
        public required Guid TraceId { get; init; }
        public required string OpenCode { get; init; }
    }
}
