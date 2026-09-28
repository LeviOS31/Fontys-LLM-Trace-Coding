using FluentValidation;
using Mediator;
using Shared;

namespace JudgeTemplates.Feature.RestoreJudgeTemplateVersion;

public class RestoreJudgeTemplateVersionRequest : IRequest<Result<RestoreJudgeTemplateVersionResponse>>
{
    public required Guid UserId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid JudgeTemplateId { get; init; }
    public required int VersionNumber { get; init; }
}

public sealed class RestoreJudgeTemplateVersionRequestValidator
    : AbstractValidator<RestoreJudgeTemplateVersionRequest>
{
    public RestoreJudgeTemplateVersionRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.JudgeTemplateId).NotEmpty();
        RuleFor(x => x.VersionNumber).GreaterThan(0);
    }
}