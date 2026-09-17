using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetAllProjectVersions;
using Projects.Data;
using Projects.Data.Models;
using Serilog;
using Shared;
using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Text;

namespace Projects.Features.GetProjectVersions
{
    public class GetProjectVersionsHandler: 
        IRequestHandler<GetAllProjectVersionsQuery, Result<GetAllProjectVersionsResponse>>
    {
        private static readonly ILogger logger = Log.ForContext<GetProjectVersionsHandler>();
        private readonly IMediator _mediator;
        private readonly ProjectDbContext _projectDbContext;

        public GetProjectVersionsHandler(IMediator mediator, ProjectDbContext projectDbContext)
        {
            _mediator = mediator;
            _projectDbContext = projectDbContext;
        }

        public async ValueTask<Result<GetAllProjectVersionsResponse>> Handle(
            GetAllProjectVersionsQuery request,
            CancellationToken cancellationToken
        )
        {
            try
            {
                var versions = await _projectDbContext.Versions
                    .AsNoTracking().Where(c => c.ProjectId == request.ProjectId)
                    .ToListAsync(cancellationToken);

                return new GetAllProjectVersionsResponse
                {
                    Versions = versions.Select(v => new ProjectVersionSummary
                    {
                        VersionId = v.VersionId,
                        ProjectId = v.ProjectId,
                        Name = v.Name,
                        Description = v.Description
                    }).ToList()
                };
            }
            catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                logger.Error(ex, "Error retrieving versions for project {ProjectId}", request.ProjectId);
                return ErrorCode.DatabaseError;
            }
        }

    }
}
