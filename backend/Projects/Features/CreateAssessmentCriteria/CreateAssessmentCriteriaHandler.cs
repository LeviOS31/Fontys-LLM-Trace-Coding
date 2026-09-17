using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Projects.Data;
using Serilog;
using Shared;
using System.Data.Common;
using AssessmentCriteriaModel = Projects.Data.Models.AssessmentCriteria;


namespace Projects.Features.CreateAssessmentCriteria
{
    public class CreateAssessmentCriteriaHandler : IRequestHandler<CreateAssessmentCriteriaRequest, Result<CreateAssessmentCriteriaResponse>>
    {
        private static readonly ILogger Logger = Log.ForContext<CreateAssessmentCriteriaHandler>();
        private readonly ProjectDbContext _projectsDbContext;
        private readonly IMediator _mediator;

        public CreateAssessmentCriteriaHandler(ProjectDbContext projectsDbContext, IMediator mediator)
        {
            _projectsDbContext = projectsDbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<CreateAssessmentCriteriaResponse>> Handle(
            CreateAssessmentCriteriaRequest request,
            CancellationToken cancellationToken 
        )
        {
            var getProjectQuery = new GetProjectQuery { ProjectId = request.ProjectId, UserId = request.UserId };
            var getProjectResult = await _mediator.Send(getProjectQuery, cancellationToken);

            if (!getProjectResult.IsSuccess)
            {
                Logger.Warning(
                    "Failed to retrieve project {ProjectId} for user {UserId}. Error: {ErrorCode}",
                    request.ProjectId,
                    request.UserId,
                    getProjectResult.ErrorCode
                );
                return getProjectResult.ErrorCode;
            }

            var assessmentCriteria = new AssessmentCriteriaModel
            {
                CriteriaId = Guid.NewGuid(),
                ProjectId = request.ProjectId,
                Criteria = request.Criteria
            };

            int changes;

            try
            {
                await _projectsDbContext.AssessmentCriterias.AddAsync(assessmentCriteria, cancellationToken);
                changes = await _projectsDbContext.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                Logger.Error(ex, "Error saving assessment criteria for project {ProjectId}", request.ProjectId);
                return ErrorCode.DatabaseError;
            }

            if (changes > 0)
            {
                return new CreateAssessmentCriteriaResponse
                {
                    CriteriaId = assessmentCriteria.CriteriaId,
                    ProjectId = assessmentCriteria.ProjectId,
                    Criteria = assessmentCriteria.Criteria,
                };
            }

            return ErrorCode.NoChanges;
        }
    }
}
