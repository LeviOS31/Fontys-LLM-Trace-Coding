using FluentValidation;
using Mediator;
using Shared;

namespace JudgeTemplates.Feature.DeleteJudgeTemplateVersion;

public class DeleteJudgeTemplateVersionRequest : IRequest<Result<DeleteJudgeTemplateVersionResponse>>
{
    public required Guid UserId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid JudgeTemplateId { get; init; }
    public required int VersionNumber { get; init; }
}

public sealed class DeleteJudgeTemplateVersionRequestValidator
    : AbstractValidator<DeleteJudgeTemplateVersionRequest>
{
    public DeleteJudgeTemplateVersionRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.JudgeTemplateId).NotEmpty();
        RuleFor(x => x.VersionNumber).GreaterThan(0);
    }
}