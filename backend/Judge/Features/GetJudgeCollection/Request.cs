using FluentValidation;
using Mediator;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace Judge.Features.GetJudgeCollection
{
    public record GetJudgeCollectionRequest: IRequest<Result<GetJudgeCollectionResponse>>
    {
        public required Guid JudgeCollectionId { get; init; }
        public required Guid VersionId { get; init; }
        public required Guid ProjectId { get; init; }
    }

    public sealed class GetJudgeCollectionRequestValidator : AbstractValidator<GetJudgeCollectionRequest>
    {
        public GetJudgeCollectionRequestValidator()
        {
            RuleFor(x => x.JudgeCollectionId).NotEmpty();
            RuleFor(x => x.VersionId).NotEmpty();
            RuleFor(x => x.ProjectId).NotEmpty();
        }
    }
}
