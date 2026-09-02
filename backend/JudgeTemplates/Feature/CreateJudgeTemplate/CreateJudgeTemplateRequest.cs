using FluentValidation;
using Mediator;
using Shared;

namespace JudgeTemplates.Feature.CreateJudgeTemplate;

public class CreateJudgeTemplateRequest : IRequest<Result<CreateJudgeTemplateResponse>>
{
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required Guid AxialCodeId { get; init; }
    public required Guid UserId { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
}

public sealed class CreateJudgeTemplateRequestValidator : AbstractValidator<CreateJudgeTemplateRequest>
{
    public CreateJudgeTemplateRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.AxialCodeId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty();
    }
}
