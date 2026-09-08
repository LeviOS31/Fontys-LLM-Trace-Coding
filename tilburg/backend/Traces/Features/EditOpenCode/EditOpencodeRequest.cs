using FluentValidation;
using Mediator;
using Shared;
using Traces.Data.Models;

namespace Traces.Features.EditOpenCode;

public class EditOpencodeRequest : IRequest<Result<EditOpencodeResponse>>
{
    public required Guid TraceId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid UserId { get; init; }
    public required Guid ProjectId { get; init; }
    public required string OpenCode { get; init; }
}

public sealed class EditOpencodeRequestValidator : AbstractValidator<EditOpencodeRequest>
{
    public EditOpencodeRequestValidator()
    {
        RuleFor(x => x.TraceId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.OpenCode).MaximumLength(Trace.MaxOpenCodeLength);
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ProjectId).NotEmpty();
    }
}
