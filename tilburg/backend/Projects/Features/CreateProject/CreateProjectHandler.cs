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

namespace Projects.Features.CreateProject;

public class CreateProjectHandler : IRequestHandler<CreateProjectRequest, Result<CreateProjectResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<CreateProjectHandler>();
    private readonly ProjectDbContext _projectDbContext;

    public CreateProjectHandler(ProjectDbContext projectDbContext)
    {
        _projectDbContext = projectDbContext;
    }

    public async ValueTask<Result<CreateProjectResponse>> Handle(
        CreateProjectRequest request,
        CancellationToken cancellationToken
    )
    {
        var project = new Project
        {
            ProjectId = Guid.NewGuid(),
            UserId = request.UserId,
            Name = request.Name,
            Description = request.Description,
        };

        int changes;
        try
        {
            _projectDbContext.Projects.Add(project);
            changes = await _projectDbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error saving changes");
            return ErrorCode.DatabaseError;
        }

        if (changes > 0)
        {
            return new CreateProjectResponse
            {
                ProjectId = project.ProjectId,
                Name = project.Name,
                Description = project.Description,
            };
        }

        return ErrorCode.NoChanges;
    }
}
