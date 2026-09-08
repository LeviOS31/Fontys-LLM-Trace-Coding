using System.Data.Common;
using AssessmentCriteria.Contracts.Features.InternalGetAllAssessmentCriteriaOfProject;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Projects.Data;
using Projects.Data.Models;
using ProjectVersions.Contracts.Features.InternalGetProjectVersions;
using Serilog;
using Shared;
using Shared.Extensions;

namespace Projects.Features.GetProject;

public class GetProjectHandler : IRequestHandler<GetProjectQuery, Result<GetProjectResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetProjectHandler>();
    private readonly ProjectDbContext _projectDbContext;
    private readonly IMediator _mediator;

    public GetProjectHandler(ProjectDbContext projectDbContext, IMediator mediator)
    {
        _projectDbContext = projectDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<GetProjectResponse>> Handle(
        GetProjectQuery query,
        CancellationToken cancellationToken
    )
    {
        Project? project;
        try
        {
            project = await _projectDbContext
                .Projects.AsNoTracking()
                .FirstOrDefaultAsync(p => p.ProjectId == query.ProjectId, cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error retrieving project {ProjectId}", query.ProjectId);
            return ErrorCode.DatabaseError;
        }

        if (project is null)
        {
            Logger.Warning("Project {ProjectId}", query.ProjectId);
            return ErrorCode.EntityNotFound;
        }

        if (!project.HasAccess(query.UserId))
        {
            Logger.Warning("User has no access to project {ProjectId}", query.ProjectId);
            return ErrorCode.NoPermission;
        }

        var getProjectVersionsQuery = new InternalGetProjectVersionsQuery { ProjectId = query.ProjectId };
        var versions = await _mediator.Send(getProjectVersionsQuery, cancellationToken);

        if (versions.IsError)
        {
            Logger.Error("Failed to fetch project versions: {ErrorCode}", versions.ErrorCode);
            return versions.ErrorCode;
        }

        var getAssessmentCriteriaQuery = new InternalGetAllAssessmentCriteriaOfProjectQuery
        {
            ProjectId = query.ProjectId,
        };
        var assessmentCriteria = await _mediator.Send(getAssessmentCriteriaQuery, cancellationToken);

        if (assessmentCriteria.IsError)
        {
            Logger.Error("Failed to fetch assessment criteria: {ErrorCode}", assessmentCriteria.ErrorCode);
            return assessmentCriteria.ErrorCode;
        }

        return new GetProjectResponse
        {
            ProjectId = project.ProjectId,
            Name = project.Name,
            Description = project.Description,
            Versions = versions.Value.Versions,
            AssessmentCriteria = assessmentCriteria.Value.CriteriaList,
        };
    }
}
