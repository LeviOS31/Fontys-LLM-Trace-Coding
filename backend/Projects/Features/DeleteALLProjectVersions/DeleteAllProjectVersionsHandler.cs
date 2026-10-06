using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Data;
using Serilog;
using Shared;
using System.Data.Common;
using Traces.Contracts.Features.DeleteAllTracesOfVersion;

namespace Projects.Features.DeleteAllProjectVersions
{
    public class DeleteAllProjectVersionsHandler
        :IRequestHandler<DeleteAllProjectVersionRequest, 
        Result<DeleteAllProjectVersionResponse>>
    {
        private static readonly ILogger logger = Log.ForContext<DeleteAllProjectVersionsHandler>();
        private readonly IMediator _mediator;
        private readonly ProjectDbContext _projectDbContext;

        public DeleteAllProjectVersionsHandler(ProjectDbContext projectDbContext, IMediator mediator)
        {
            _projectDbContext = projectDbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<DeleteAllProjectVersionResponse>> Handle(
            DeleteAllProjectVersionRequest request,
            CancellationToken cancellationToken)
        {

            var VersionIDList = await _projectDbContext.Versions
                .Where(v => v.ProjectId == request.ProjectId)
                .Select(v => v.VersionId)
                .ToListAsync(cancellationToken);

            var changes = 0;
            try
            {
                changes = await _projectDbContext.Versions
                    .Where(v => v.ProjectId == request.ProjectId)
                    .ExecuteDeleteAsync(cancellationToken);
            }
            catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                logger.Error(ex, "Error occurred while deleting all project versions for project {ProjectId}", request.ProjectId);
                return ErrorCode.DatabaseError;
            }

            var versionid = new Guid();
            try
            {
                foreach (var versionId in VersionIDList)
                {
                    versionid = versionId;
                    var deletetraces = new DeleteAllTracesOfVersionRequest
                    {
                        VersionId = versionId,
                    };
                    var deleteTracesResult = await _mediator.Send(deletetraces, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                logger.Error(
                    ex,
                    "Error while deleting traces for version {VersionId} of project {ProjectId}: {ErrorMessage}",
                    versionid,
                    request.ProjectId,
                    ex.Message
                );
                return ErrorCode.DatabaseError;
            }

            if (changes > 0)
            {
                return new DeleteAllProjectVersionResponse();
            }

            return ErrorCode.NoChanges;
        }
    }
}
