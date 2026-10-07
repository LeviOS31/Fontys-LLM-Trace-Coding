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

namespace Projects.Features.EditProjectVersion
{
    public class EditProjectVersionHandler:
        IRequestHandler<EditProjectVersionRequest, Result<EditProjectVersionResponse>>
    {
        private static readonly ILogger Logger = Log.ForContext<EditProjectVersionHandler>();
        private readonly ProjectDbContext _projectDbContext;
        private readonly IMediator _mediator;

        public EditProjectVersionHandler(ProjectDbContext projectDbContext, IMediator mediator)
        {
            _projectDbContext = projectDbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<EditProjectVersionResponse>> Handle(
            EditProjectVersionRequest request,
            CancellationToken cancellationToken
        )
        {
            var getProjectQuery = new GetProjectQuery
            {
                UserId = request.UserId,
                ProjectId = request.ProjectId
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

            ProjectVersion? projectVersion;
            try
            {
                projectVersion = await _projectDbContext.
                    Versions.FirstOrDefaultAsync(
                        v => v.VersionId == request.VersionId && v.ProjectId == request.ProjectId,
                        cancellationToken
                    );
            }
            catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                Logger.Error(
                    ex,
                    "Error retrieving version {VersionId} for project {ProjectId}",
                    request.VersionId,
                    request.ProjectId
                );
                return ErrorCode.DatabaseError;
            }

            if (projectVersion is null)
            {
                Logger.Warning(
                    "Version {VersionId} not found for project {ProjectId}",
                    request.VersionId,
                    request.ProjectId
                );
                return ErrorCode.EntityNotFound;
            }

            bool projectVersionNameAlreadyExists;
            try
            {
                projectVersionNameAlreadyExists = await _projectDbContext
                    .Versions.AnyAsync(
                        v => v.ProjectId == request.ProjectId &&
                             v.VersionId != request.VersionId &&
                             v.Name.Trim().ToLower().Equals(request.Name.Trim().ToLower()),
                        cancellationToken
                    );
            }
            catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                Logger.Error(
                    ex,
                    "Error checking duplicate names for version {VersionId} in project {ProjectId}",
                    request.VersionId,
                    request.ProjectId
                );
                return ErrorCode.DatabaseError;
            }

            if (projectVersionNameAlreadyExists)
            {
                Logger.Warning(
                    "Version name '{VersionName}' already exists for project {ProjectId}",
                    request.Name,
                    request.ProjectId
                );
                return ErrorCode.ProjectVersionNameAlreadyExists;
            }

            projectVersion.Name = request.Name;
            projectVersion.Description = request.Description;

            try
            {
                await _projectDbContext.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
            {
                Logger.Error(
                    ex,
                    "Error updating version {VersionId} in project {ProjectId}",
                    request.VersionId,
                    request.ProjectId
                );
                return ErrorCode.DatabaseError;
            }

            return new EditProjectVersionResponse
            {
                VersionId = projectVersion.VersionId,
                ProjectId = projectVersion.ProjectId,
                Name = projectVersion.Name,
                Description = projectVersion.Description
            };
        }
    }
}
