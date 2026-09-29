using FluentValidation;
using Mediator;
using Projects.Features.DeleteProject;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace Projects.Features.DeleteAllAssessmentCriteriaOfProject
{
    public class DeleteAllAssessmentCriteriaOfProjectRequest: IRequest<Result<DeleteAllAssessmentCriteriaOfProjectResponse>>
    {
        public Guid ProjectId { get; init; }
    }

    public sealed class DeleteAllAssessmentCriteriaOfProjectRequestValidator : AbstractValidator<DeleteAllAssessmentCriteriaOfProjectRequest>
    {
        public DeleteAllAssessmentCriteriaOfProjectRequestValidator()
        {
            RuleFor(x => x.ProjectId).NotEmpty();
        }
    }
}
