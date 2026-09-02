using FluentValidation;
using Mediator;
using Shared;

namespace JudgeTemplates.Feature.DeleteJudgeTemplate;

public class DeleteJudgeTemplateRequest : IRequest<Result<DeleteJudgeTemplateResponse>>
{
    public required Guid UserId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid JudgeTemplateId { get; init; }
}

public sealed class DeleteJudgeTemplateRequestValidator : AbstractValidator<DeleteJudgeTemplateRequest>
{
    public DeleteJudgeTemplateRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.JudgeTemplateId).NotEmpty();
    }
}
