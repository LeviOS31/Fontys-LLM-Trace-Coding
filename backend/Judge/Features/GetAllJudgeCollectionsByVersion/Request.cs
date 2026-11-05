using FluentValidation;
using Mediator;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace Judge.Features.GetAllJudgeCollectionsByVersion
{
    public record GetAllJudgeCollectionsByVersionRequest : IRequest<Result<GetAllJudgeCollectionsByVersionResponse>>
    {
        public required Guid ProjectId { get; init; } 
        public required Guid VersionId { get; init; }
    }

    public sealed class GetAllJudgeCollectionsByVersionRequestValidator : AbstractValidator<GetAllJudgeCollectionsByVersionRequest>
    {
        public GetAllJudgeCollectionsByVersionRequestValidator()
        {
            RuleFor(x => x.ProjectId).NotEmpty();
            RuleFor(x => x.VersionId).NotEmpty();
        }
    }
}
