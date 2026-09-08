using System.Data.Common;
using AssessmentCriteria.Contracts.Features.InternalDeleteAllAssessmentCriteriaOfProject;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Data;
using Projects.Data.Models;
using ProjectVersions.Contracts.Features.InternalDeleteAllProjectVersions;
using Serilog;
using Shared;
using Shared.Extensions;

namespace Projects.Features.DeleteProject;

public class DeleteProjectHandler : IRequestHandler<DeleteProjectRequest, Result<DeleteProjectResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<DeleteProjectHandler>();
    private readonly ProjectDbContext _projectDbContext;
    private readonly IMediator _mediator;

    public DeleteProjectHandler(ProjectDbContext projectDbContext, IMediator mediator)
    {
        _projectDbContext = projectDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<DeleteProjectResponse>> Handle(
        DeleteProjectRequest request,
        CancellationToken cancellationToken
    )
    {
        Project? project;

        // 1. Retrieve
        try
        {
            project = await _projectDbContext
                .Projects.AsNoTracking()
                .FirstOrDefaultAsync(p => p.ProjectId == request.ProjectId, cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error retrieving project {ProjectId}", request.ProjectId);
            return ErrorCode.DatabaseError;
        }

        // 2. Validate
        if (project is null)
        {
            Logger.Warning("Project {ProjectId} not found", request.ProjectId);
            return ErrorCode.EntityNotFound;
        }

        if (!project.HasAccess(request.UserId))
        {
            Logger.Warning(
                "User {UserId} attempted to delete project {ProjectId} that they do not own",
                request.UserId,
                request.ProjectId
            );
            return ErrorCode.NoPermission;
        }

        // 3. Delete
        var deleteAssessmentCriteriaSuccess = await DeleteProjectAssessmentCriteria(
            request.ProjectId,
            cancellationToken
        );
        if (!deleteAssessmentCriteriaSuccess)
        {
            return ErrorCode.NoChanges;
        }

        var deleteVersionsSuccess = await DeleteProjectVersions(request.ProjectId, cancellationToken);
        if (!deleteVersionsSuccess)
        {
            return ErrorCode.NoChanges;
        }

        int changes;
        try
        {
            changes = await _projectDbContext
                .Projects.Where(p => p.ProjectId == request.ProjectId)
                .ExecuteDeleteAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error deleting database");
            return ErrorCode.DatabaseError;
        }

        // 4. Return
        if (changes > 0)
        {
            return new DeleteProjectResponse();
        }
        return ErrorCode.NoChanges;
    }

    private async ValueTask<bool> DeleteProjectAssessmentCriteria(Guid projectId, CancellationToken cancellationToken)
    {
        var deleteAllAssessmentCriteriaRequest = new InternalDeleteAllAssessmentCriteriaOfProjectRequest
        {
            ProjectId = projectId,
        };
        var deleteAllAssessmentCriteriaResult = await _mediator.Send(
            deleteAllAssessmentCriteriaRequest,
            cancellationToken
        );
        if (
            deleteAllAssessmentCriteriaResult.IsSuccess
            || deleteAllAssessmentCriteriaResult.ErrorCode == ErrorCode.NoChanges
        )
        {
            return true;
        }

        Logger.Warning(
            "Failed to delete all assessment criteria of {ProjectId}. Error: {ErrorCode}",
            projectId,
            deleteAllAssessmentCriteriaResult.ErrorCode
        );
        return false;
    }

    private async ValueTask<bool> DeleteProjectVersions(Guid projectId, CancellationToken cancellationToken)
    {
        var deleteAllProjectVersionsRequest = new InternalDeleteAllProjectVersionsRequest { ProjectId = projectId };
        var deleteAllProjectVersionsResult = await _mediator.Send(deleteAllProjectVersionsRequest, cancellationToken);
        if (deleteAllProjectVersionsResult.IsSuccess || deleteAllProjectVersionsResult.ErrorCode == ErrorCode.NoChanges)
        {
            return true;
        }

        Logger.Warning(
            "Failed to delete all versions of {ProjectId}. Error: {ErrorCode}",
            projectId,
            deleteAllProjectVersionsResult.ErrorCode
        );
        return false;
    }
}
