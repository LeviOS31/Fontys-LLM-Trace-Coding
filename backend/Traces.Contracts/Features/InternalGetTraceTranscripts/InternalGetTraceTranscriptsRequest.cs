using FluentValidation;
using Mediator;
using Shared;

namespace Traces.Contracts.Features.InternalGetTraceTranscripts;

public record InternalGetTraceTranscriptsRequest : IRequest<Result<InternalGetTraceTranscriptsResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid UserId { get; init; }
    public Guid? TraceCollectionId { get; init; }
    public Guid? TraceId { get; init; }
}

public sealed class InternalGetTraceTranscriptsRequestValidator
    : AbstractValidator<InternalGetTraceTranscriptsRequest>
{
    public InternalGetTraceTranscriptsRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}