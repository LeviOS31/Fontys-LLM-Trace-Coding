using System;
using System.Data.Common;
using System.Threading;
using System.Threading.Tasks;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Data;
using Projects.Data.Models;
using Serilog;
using Shared;
using Shared.Extensions;

namespace Projects.Features.EditProject;

public class EditProjectHandler : IRequestHandler<EditProjectRequest, Result<EditProjectResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<EditProjectHandler>();
    private readonly ProjectDbContext _projectDbContext;

    public EditProjectHandler(ProjectDbContext projectDbContext)
    {
        _projectDbContext = projectDbContext;
    }

    public async ValueTask<Result<EditProjectResponse>> Handle(
        EditProjectRequest request,
        CancellationToken cancellationToken
    )
    {
        // Get project
        Project? project;
        try
        {
            project = await _projectDbContext.Projects.FirstOrDefaultAsync(
                x => x.ProjectId == request.ProjectId,
                cancellationToken: cancellationToken
            );
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Failed to get project with ID {ProjectId}", request.ProjectId);
            return ErrorCode.DatabaseError;
        }

        if (project is null)
        {
            return ErrorCode.EntityNotFound;
        }

        // Test permission
        if (!project.HasAccess(request.UserId))
        {
            return ErrorCode.Unauthorized;
        }

        // Update project
        project.Name = request.Name;
        project.Description = request.Description;

        try
        {
            await _projectDbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Failed to update project with ID {ProjectId}", request.ProjectId);
            return ErrorCode.DatabaseError;
        }

        // Response
        return new EditProjectResponse
        {
            ProjectId = project.ProjectId,
            UserId = project.UserId,
            Name = project.Name,
            Description = project.Description,
        };
    }
}
