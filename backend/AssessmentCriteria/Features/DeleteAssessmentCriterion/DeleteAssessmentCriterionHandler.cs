using System.Data.Common;
using AssessmentCriteria.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;

namespace AssessmentCriteria.Features.DeleteAssessmentCriterion;

public class DeleteAssessmentCriterionHandler
    : IRequestHandler<DeleteAssessmentCriterionRequest, Result<DeleteAssessmentCriterionResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<DeleteAssessmentCriterionHandler>();
    private readonly AssessmentCriteriaDbContext _assessmentCriteriaDbContext;
    private readonly IMediator _mediator;

    public DeleteAssessmentCriterionHandler(AssessmentCriteriaDbContext assessmentCriteriaDbContext, IMediator mediator)
    {
        _assessmentCriteriaDbContext = assessmentCriteriaDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<DeleteAssessmentCriterionResponse>> Handle(
        DeleteAssessmentCriterionRequest request,
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

        try
        {
            var exists = await _assessmentCriteriaDbContext
                .AssessmentCriteria.Where(c => c.ProjectId == request.ProjectId && c.CriterionId == request.CriterionId)
                .AnyAsync(cancellationToken);

            if (!exists)
                return ErrorCode.EntityNotFound;
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error checking if criterion {CriterionId} for project {ProjectId} exists",
                request.CriterionId,
                request.ProjectId
            );
            return ErrorCode.DatabaseError;
        }

        int changes;
        try
        {
            changes = await _assessmentCriteriaDbContext
                .AssessmentCriteria.Where(c => c.ProjectId == request.ProjectId && c.CriterionId == request.CriterionId)
                .ExecuteDeleteAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error deleting assessment criterion {CriterionId} for project {ProjectId}",
                request.CriterionId,
                request.ProjectId
            );
            return ErrorCode.DatabaseError;
        }

        if (changes > 0)
        {
            return new DeleteAssessmentCriterionResponse();
        }

        return ErrorCode.NoChanges;
    }
}
