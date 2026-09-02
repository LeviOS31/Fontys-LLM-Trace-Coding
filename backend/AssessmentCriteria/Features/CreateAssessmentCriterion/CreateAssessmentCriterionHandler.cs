using System.Data.Common;
using AssessmentCriteria.Data;
using AssessmentCriteria.Data.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;

namespace AssessmentCriteria.Features.CreateAssessmentCriterion;

public class CreateAssessmentCriterionHandler
    : IRequestHandler<CreateAssessmentCriterionRequest, Result<CreateAssessmentCriterionResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<CreateAssessmentCriterionHandler>();
    private readonly AssessmentCriteriaDbContext _assessmentCriteriaDbContext;
    private readonly IMediator _mediator;

    public CreateAssessmentCriterionHandler(AssessmentCriteriaDbContext assessmentCriteriaDbContext, IMediator mediator)
    {
        _assessmentCriteriaDbContext = assessmentCriteriaDbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<CreateAssessmentCriterionResponse>> Handle(
        CreateAssessmentCriterionRequest request,
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

        var assessmentCriterion = new AssessmentCriterion
        {
            CriterionId = Guid.NewGuid(),
            ProjectId = request.ProjectId,
            Criterion = request.Criterion,
        };

        int changes;
        try
        {
            await _assessmentCriteriaDbContext.AssessmentCriteria.AddAsync(assessmentCriterion, cancellationToken);
            changes = await _assessmentCriteriaDbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error saving assessment criterion for project {ProjectId}", request.ProjectId);
            return ErrorCode.DatabaseError;
        }

        if (changes > 0)
        {
            return new CreateAssessmentCriterionResponse
            {
                CriterionId = assessmentCriterion.CriterionId,
                ProjectId = assessmentCriterion.ProjectId,
                Criterion = assessmentCriterion.Criterion,
            };
        }

        return ErrorCode.NoChanges;
    }
}
