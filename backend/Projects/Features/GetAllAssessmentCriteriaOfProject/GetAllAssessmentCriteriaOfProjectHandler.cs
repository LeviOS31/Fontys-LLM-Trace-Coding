using System.Data.Common;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Data;
using Projects.Contracts.Features.GetAllAssessmentCriteriaOfProject;
using Serilog;
using Shared;

namespace Projects.Features.GetAllAssessmentCriteriaOfProject
{
    public class GetAllAssessmentCriteriaOfProjectHandler
        : IRequestHandler<
            GetAllAssessmentCriteriaOfProjectQuery,
            Result<GetAllAssessmentCriteriaOfProjectResponse>>
    {
        private static readonly ILogger logger = Log.ForContext<GetAllAssessmentCriteriaOfProjectHandler>();
        private readonly ProjectDbContext _projectDbContext;

        public GetAllAssessmentCriteriaOfProjectHandler(ProjectDbContext projectDbContext)
        {
            _projectDbContext = projectDbContext;
        }

        public async ValueTask<Result<GetAllAssessmentCriteriaOfProjectResponse>> Handle(
            GetAllAssessmentCriteriaOfProjectQuery request,
            CancellationToken cancellationToken
        )
        {
            try
            {
                var assessmentCriteria = await _projectDbContext
                    .AssessmentCriterias.AsNoTracking()
                    .Where(c => c.ProjectId == request.ProjectId)
                    .ToListAsync(cancellationToken);

                return new GetAllAssessmentCriteriaOfProjectResponse
                {
                    criteriaList = assessmentCriteria
                    .Select(c => new GetAllAssessmentCriteriaOfProjectResponse.AssessmentCriteria
                    {
                        CriteriaId = c.CriteriaId,
                        Criteria = c.Criteria
                    })
                    .ToList(),
                };
            }
            catch ( Exception ex ) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                logger.Error(ex, "Error retrieving assessment criteria for project {ProjectId}", request.ProjectId);
                return ErrorCode.DatabaseError;
            }
        }
    }
}
