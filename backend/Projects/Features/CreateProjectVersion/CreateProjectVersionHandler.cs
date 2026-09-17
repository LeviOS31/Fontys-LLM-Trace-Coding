using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Projects.Data;
using Projects.Data.Models;
using Serilog;
using Shared;
using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Text;


namespace Projects.Features.CreateProjectVersion
{
    public class CreateProjectVersionHandler
        : IRequestHandler<CreateProjectVersionRequest, Result<CreateProjectVersionResponse>>
    {
        private static readonly ILogger Logger = Log.ForContext<CreateProjectVersionHandler>();
        private readonly ProjectDbContext _projectDbContext;
        private readonly IMediator _mediator;

        public CreateProjectVersionHandler(ProjectDbContext projectDbContext, IMediator mediator)
        {
            _projectDbContext = projectDbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<CreateProjectVersionResponse>> Handle(
            CreateProjectVersionRequest request,
            CancellationToken cancellationToken)
        {
            var getProjectQuery = new GetProjectQuery {
                ProjectId = request.ProjectId,
                UserId = request.UserId
            };
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

            var existingProjectVersionWithSameName = await _projectDbContext
                .Versions.Where(v => v.ProjectId == request.ProjectId && v.Name.Trim().ToLower().Equals(request.Name.Trim().ToLower()))
                .AnyAsync(cancellationToken);

            if (existingProjectVersionWithSameName)
            {
                Logger.Warning(
                    "Project version with name {VersionName} already exists for project {ProjectId}.",
                    request.Name,
                    request.ProjectId
                );
                return ErrorCode.ProjectVersionNameAlreadyExists;
            }

            return await CreateProjectVersion(request, getProjectResult.Value, cancellationToken);
        }

        private async ValueTask<Result<CreateProjectVersionResponse>> CreateProjectVersion(
            CreateProjectVersionRequest request,
            GetProjectResponse project,
            CancellationToken cancellationToken)
        {
            var projectversion = new ProjectVersion
            {
                VersionId = Guid.NewGuid(),
                ProjectId = request.ProjectId,
                Name = request.Name.Trim(),
                Description = request.Description.Trim(),
            };

            int changes;
            try
            {
                _projectDbContext.Versions.Add(projectversion);
                changes = await _projectDbContext.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                Logger.Error(ex, "Error occurred while creating project version.");
                return ErrorCode.DatabaseError;
            }

            if (changes > 0)
            {
                return new CreateProjectVersionResponse
                {
                    VersionId = projectversion.VersionId,
                    ProjectId = projectversion.ProjectId,
                    Name = projectversion.Name,
                    Description = projectversion.Description
                };
            }

            return ErrorCode.NoChanges;
        }
    }
}
