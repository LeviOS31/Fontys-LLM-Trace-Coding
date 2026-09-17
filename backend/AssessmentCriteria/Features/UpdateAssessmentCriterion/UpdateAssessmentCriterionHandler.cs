using System.Data.Common;
using AssessmentCriteria.Data;
using AssessmentCriteria.Data.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;

namespace AssessmentCriteria.Features.UpdateAssessmentCriterion;

public class UpdateAssessmentCriterionHandler
    : IRequestHandler<UpdateAssessmentCriterionRequest, Result<UpdateAssessmentCriterionResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<UpdateAssessmentCriterionHandler>();
    private readonly AssessmentCriteriaDbContext _assessmentCriteriaDbContext;
    private readonly IMediator _mediator;

    public UpdateAssessmentCriterionHandler(AssessmentCriteriaDbContext assessmentCriteriaDbContext, IMediator mediator)
    {
        _assessmentCriteriaDbContext = assessmentCriteriaDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<UpdateAssessmentCriterionResponse>> Handle(
        UpdateAssessmentCriterionRequest request,
        CancellationToken cancellationToken
    )
    {
        // Project ownership tested in the GetProjectQuery

        var getProjectQuery = new GetProjectQuery { ProjectId = request.ProjectId, UserId = request.UserId };
        var getProjectResult = await _mediator.Send(getProjectQuery, cancellationToken);

        if (!getProjectResult.IsSuccess)
        {
            Logger.Warning(
                "Failed to retrieve project {ProjectId} for user {UserId}. Error: {ErrorCode}",
                request.ProjectId,
                request.UserId,
                getProjectResult.ErrorCode
            );
            return getProjectResult.ErrorCode!.Value;
        }

        AssessmentCriterion? assessmentCriterion;
        try
        {
            assessmentCriterion = await _assessmentCriteriaDbContext.AssessmentCriteria.FirstOrDefaultAsync(
                c => c.ProjectId == request.ProjectId && c.CriterionId == request.CriterionId,
                cancellationToken
            );
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error retrieving criterion {CriterionId} for project {ProjectId}",
                request.CriterionId,
                request.ProjectId
            );
            return ErrorCode.DatabaseError;
        }

        if (assessmentCriterion is null)
        {
            Logger.Warning(
                "Assessment criterion {CriterionId} for project {ProjectId} was not found",
                request.CriterionId,
                request.ProjectId
            );
            return ErrorCode.EntityNotFound;
        }

        assessmentCriterion.Criterion = request.Criterion;

        try
        {
            await _assessmentCriteriaDbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error updating criterion {CriterionId} for project {ProjectId}",
                request.CriterionId,
                request.ProjectId
            );
            return ErrorCode.DatabaseError;
        }

        return new UpdateAssessmentCriterionResponse
        {
            CriterionId = assessmentCriterion.CriterionId,
            ProjectId = assessmentCriterion.ProjectId,
            Criterion = assessmentCriterion.Criterion,
        };
    }
}
