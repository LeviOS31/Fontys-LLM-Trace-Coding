using FluentValidation;
using Mediator;
using Shared;

namespace Judge.Features.UpdateJudgeCollection;

public record UpdateJudgeCollectionRequest : IRequest<Result<UpdateJudgeCollectionResponse>>
{
    public required Guid JudgeCollectionId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required string Name { get; init; }
}

public sealed class UpdateJudgeCollectionRequestValidator : AbstractValidator<UpdateJudgeCollectionRequest>
{
    public UpdateJudgeCollectionRequestValidator()
    {
        RuleFor(x => x.JudgeCollectionId).NotEmpty();
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.ProjectVersionId).NotEmpty();
        RuleFor(x => x.Name).Must(name => !string.IsNullOrWhiteSpace(name))
            .WithMessage("A collection name is required.");
    }
}