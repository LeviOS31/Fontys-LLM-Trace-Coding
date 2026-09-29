using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Projects.Data;
using Projects.Data.Models;
using Projects.Features.DeleteAssessmentCriteria;
using Serilog;
using Shared;
using System.Data.Common;

namespace Projects.Features.DeleteProjectVersion
{
    public class DeleteProjectVersionHandler
        : IRequestHandler<DeleteProjectVersionRequest, Result<DeleteProjectVersionResponse>>
    {
        private static readonly ILogger Logger = Log.ForContext<DeleteProjectVersionHandler>();
        private readonly IMediator mediator;
        private readonly ProjectDbContext _projectDbContext;

        public DeleteProjectVersionHandler( IMediator mediator, ProjectDbContext projectDbContext)
        {
            this.mediator = mediator;
            _projectDbContext = projectDbContext;
        }

        public async ValueTask<Result<DeleteProjectVersionResponse>> Handle(
            DeleteProjectVersionRequest request,
            CancellationToken cancellationToken
        )
        {
            var getProjectQuery = new GetProjectQuery { ProjectId = request.ProjectId, UserId = request.UserId };
            var getProjectResult = await mediator.Send(getProjectQuery, cancellationToken);

            if (!getProjectResult.IsSuccess)
            {
                Logger.Warning(
                    "Failed to get project with ID {ProjectId} for user {UserId}. Error: {ErrorCode}",
                    request.ProjectId,
                    request.UserId,
                    getProjectResult.ErrorCode
                );
                return getProjectResult.ErrorCode;
            }

            ProjectVersion? version;
            try
            {
                version = await _projectDbContext
                    .Versions.Where(v => v.ProjectId == request.ProjectId && v.VersionId == request.VersionId)
                    .SingleOrDefaultAsync(cancellationToken);

                if ( version is null)
                {
                    return ErrorCode.EntityNotFound;
                }
            }
            catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                Logger.Error(
                    ex,
                    "Error while retrieving version {VersionId} for project {ProjectId}: {ErrorMessage}",
                    request.VersionId,
                    request.ProjectId,
                    ex.Message
                );
                return ErrorCode.DatabaseError;
            }

            int changes;
            try
            {
                changes = await _projectDbContext.Versions
                    .Where(v => v.ProjectId == request.ProjectId && v.VersionId == request.VersionId)
                    .ExecuteDeleteAsync(cancellationToken);
            }
            catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                Logger.Error(
                    ex,
                    "Error while deleting version {VersionId} for project {ProjectId}: {ErrorMessage}",
                    request.VersionId,
                    request.ProjectId,
                    ex.Message
                );
                return ErrorCode.DatabaseError;
            }

            if (changes > 0)
            {
                return new DeleteProjectVersionResponse();
            }

            return ErrorCode.NoChanges;
        }
    }
}
