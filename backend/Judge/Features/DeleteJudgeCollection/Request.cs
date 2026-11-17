using FluentValidation;
using Mediator;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace Judge.Features.DeleteJudgeCollection
{
    public record DeleteJudgeCollectionRequest : IRequest<Result<DeleteJudgeCollectionResponse>>
    {
        public required Guid JudgeCollectionId { get; init; }
        public required Guid ProjectId { get; init; }
        public required Guid ProjectVersionId { get; init; }
    }

    public sealed class DeleteJudgeCollectionRequestValidator : AbstractValidator<DeleteJudgeCollectionRequest>
    {
        public DeleteJudgeCollectionRequestValidator()
        {
            RuleFor(x => x.JudgeCollectionId).NotEmpty();
            RuleFor(x => x.ProjectId).NotEmpty();
            RuleFor(x => x.ProjectVersionId).NotEmpty();
        }
    }
}
