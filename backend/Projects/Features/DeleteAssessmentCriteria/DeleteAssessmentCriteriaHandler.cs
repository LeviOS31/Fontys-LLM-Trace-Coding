using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Projects.Data;
using Serilog;
using Shared;
using System.Data.Common;

namespace Projects.Features.DeleteAssessmentCriteria
{
    public class DeleteAssessmentCriteriaHandler: IRequestHandler<DeleteAssessmentCriteriaRequest, Result<DeleteAssessmentCriteriaResponse>>
    {
        private static readonly ILogger Logger = Log.ForContext<DeleteAssessmentCriteriaHandler>();
        private readonly ProjectDbContext _projectDbContext;
        private readonly IMediator _mediator;

        public DeleteAssessmentCriteriaHandler(ProjectDbContext projectDbContext, IMediator mediator)
        {
            _projectDbContext = projectDbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<DeleteAssessmentCriteriaResponse>> Handle(
            DeleteAssessmentCriteriaRequest request,
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
                return getProjectResult.ErrorCode!.Value;
            }

            try
            {
                var exists = await _projectDbContext
                    .AssessmentCriterias.Where(c => c.ProjectId == request.ProjectId && c.CriteriaId == request.CriteriaId)
                    .AnyAsync(cancellationToken);

                if (!exists) 
                {
                    return ErrorCode.EntityNotFound;
                }
            }
            catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                Logger.Error(
                    ex,
                    "Error checking if criteria {CriteriaId} exists for project {ProjectId}.",
                    request.CriteriaId,
                    request.ProjectId
                    );
                return ErrorCode.DatabaseError;
            }

            int changes;
            try
            {
                changes = await _projectDbContext.AssessmentCriterias
                    .Where(c => c.ProjectId == request.ProjectId && c.CriteriaId == request.CriteriaId)
                    .ExecuteDeleteAsync(cancellationToken);
            }
            catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                Logger.Error(
                    ex,
                    "Error deleting criteria {CriteriaId} for project {ProjectId}.",
                    request.CriteriaId,
                    request.ProjectId
                );
                return ErrorCode.DatabaseError;
            }

            if (changes > 0)
            {
                return new DeleteAssessmentCriteriaResponse();
            }

            return ErrorCode.NoChanges;
        }
    }
}
