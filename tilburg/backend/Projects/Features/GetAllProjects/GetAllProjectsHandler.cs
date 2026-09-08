using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Data;
using Projects.Data.Models;
using Serilog;
using Shared;

namespace Projects.Features.GetAllProjects;

public class GetAllProjectsHandler : IRequestHandler<GetAllProjectsQuery, Result<GetAllProjectsResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetAllProjectsHandler>();
    private readonly ProjectDbContext _projectDbContext;

    public GetAllProjectsHandler(ProjectDbContext projectDbContext)
    {
        _projectDbContext = projectDbContext;
    }

    public async ValueTask<Result<GetAllProjectsResponse>> Handle(
        GetAllProjectsQuery query,
        CancellationToken cancellationToken
    )
    {
        List<Project> projects;

        try
        {
            projects = await _projectDbContext
                .Projects.AsNoTracking()
                .Where(p => p.UserId == query.UserId)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error retrieving projects for user {UserId}", query.UserId);
            return ErrorCode.DatabaseError;
        }

        var response = new GetAllProjectsResponse
        {
            Projects = projects
                .Select(p => new GetAllProjectsResponse.ProjectSummary()
                {
                    ProjectId = p.ProjectId,
                    Name = p.Name,
                    Description = p.Description,
                })
                .ToList(),
        };

        return response;
    }
}
