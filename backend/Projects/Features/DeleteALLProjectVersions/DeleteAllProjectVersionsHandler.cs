using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Data;
using Serilog;
using Shared;
using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Text;

namespace Projects.Features.DeleteAllProjectVersions
{
    public class DeleteAllProjectVersionsHandler
        :IRequestHandler<DeleteAllProjectVersionRequest, 
        Result<DeleteAllProjectVersionRepsonse>>
    {
        private static readonly ILogger logger = Log.ForContext<DeleteAllProjectVersionsHandler>();
        private readonly IMediator _mediator;
        private readonly ProjectDbContext _projectDbContext;

        public DeleteAllProjectVersionsHandler(ProjectDbContext projectDbContext, IMediator mediator)
        {
            _projectDbContext = projectDbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<DeleteAllProjectVersionRepsonse>> Handle(
            DeleteAllProjectVersionRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                var changes = await _projectDbContext.Versions
                    .Where(v => v.ProjectId == request.ProjectId)
                    .ExecuteDeleteAsync(cancellationToken);

                if (changes > 0)
                {
                    return new DeleteAllProjectVersionRepsonse();
                }

                return ErrorCode.NoChanges;
            }
            catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                logger.Error(ex, "Error occurred while deleting all project versions for project {ProjectId}", request.ProjectId);
                return ErrorCode.DatabaseError;
            }
        }
    }
}
