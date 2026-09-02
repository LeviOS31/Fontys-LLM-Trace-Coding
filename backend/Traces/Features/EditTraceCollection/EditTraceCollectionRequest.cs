using FluentValidation;
using Mediator;
using Shared;
using Traces.Data.Models;

namespace Traces.Features.EditTraceCollection;

public record EditTraceCollectionRequest : IRequest<Result<EditTraceCollectionResponse>>
{
    public required Guid TraceCollectionId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid UserId { get; init; }
    public required string Name { get; init; }
}

public sealed class EditTraceCollectionRequestValidator : AbstractValidator<EditTraceCollectionRequest>
{
    public EditTraceCollectionRequestValidator()
    {
        RuleFor(x => x.TraceCollectionId).NotEmpty();
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(TraceCollection.MaxNameLength)
            .MinimumLength(TraceCollection.MinNameLength);
    }
}
