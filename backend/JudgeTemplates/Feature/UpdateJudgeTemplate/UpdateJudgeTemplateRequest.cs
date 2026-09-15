using FluentValidation;
using Mediator;
using Shared;

namespace JudgeTemplates.Feature.UpdateJudgeTemplate;

public class UpdateJudgeTemplateRequest : IRequest<Result<UpdateJudgeTemplateResponse>>
{
    public required Guid UserId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid JudgeTemplateId { get; init; }
    public required string Content { get; init; }
}

public sealed class UpdateJudgeTemplateRequestValidator : AbstractValidator<UpdateJudgeTemplateRequest>
{
    public UpdateJudgeTemplateRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.JudgeTemplateId).NotEmpty();
        RuleFor(x => x.Content).NotEmpty();
    }
}