using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Data;
using Serilog;
using Shared;
using System.Data.Common;
using Mediator;

namespace Projects.Features.DeleteAllAssessmentCriteriaOfProject
{
    public class DeleteAllAssessmentCriteriaOfProjectHandler
        :IRequestHandler<DeleteAllAssessmentCriteriaOfProjectRequest,
        Result<DeleteAllAssessmentCriteriaOfProjectResponse>>
    {
        private static readonly ILogger logger = Log.ForContext<DeleteAllAssessmentCriteriaOfProjectHandler>();
        private readonly ProjectDbContext _projectDbContext;
        private readonly IMediator _mediator;

        public DeleteAllAssessmentCriteriaOfProjectHandler(ProjectDbContext projectDbContext, IMediator mediator)
        {
            _projectDbContext = projectDbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<DeleteAllAssessmentCriteriaOfProjectResponse>> Handle(
            DeleteAllAssessmentCriteriaOfProjectRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                var changes = await _projectDbContext.AssessmentCriterias
                    .Where(ac => ac.ProjectId == request.ProjectId)
                    .ExecuteDeleteAsync(cancellationToken);

                if (changes > 0)
                {
                    return new DeleteAllAssessmentCriteriaOfProjectResponse();
                }

                return ErrorCode.NoChanges;
            }
            catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                logger.Error(ex, "Error deleting assessment criteria for project {ProjectId}", request.ProjectId);
                return ErrorCode.DatabaseError;
            }
        }
    }
}
