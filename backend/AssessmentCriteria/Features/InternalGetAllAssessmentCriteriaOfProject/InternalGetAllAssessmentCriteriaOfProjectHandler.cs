using System.Data.Common;
using AssessmentCriteria.Contracts.Features.InternalGetAllAssessmentCriteriaOfProject;
using AssessmentCriteria.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace AssessmentCriteria.Features.InternalGetAllAssessmentCriteriaOfProject;

public class InternalGetAllAssessmentCriteriaOfProjectHandler
    : IRequestHandler<
        InternalGetAllAssessmentCriteriaOfProjectQuery,
        Result<InternalGetAllAssessmentCriteriaOfProjectResponse>
    >
{
    private static readonly ILogger Logger = Log.ForContext<InternalGetAllAssessmentCriteriaOfProjectHandler>();
    private readonly AssessmentCriteriaDbContext _assessmentCriteriaDbContext;

    public InternalGetAllAssessmentCriteriaOfProjectHandler(AssessmentCriteriaDbContext assessmentCriteriaDbContext)
    {
        _assessmentCriteriaDbContext = assessmentCriteriaDbContext;
    }

    public async ValueTask<Result<InternalGetAllAssessmentCriteriaOfProjectResponse>> Handle(
        InternalGetAllAssessmentCriteriaOfProjectQuery request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var assessmentCriteria = await _assessmentCriteriaDbContext
                .AssessmentCriteria.AsNoTracking()
                .Where(c => c.ProjectId == request.ProjectId)
                .ToListAsync(cancellationToken);

            return new InternalGetAllAssessmentCriteriaOfProjectResponse
            {
                CriteriaList = assessmentCriteria
                    .Select(c => new InternalGetAllAssessmentCriteriaOfProjectResponse.AssessmentCriterion
                    {
                        CriterionId = c.CriterionId,
                        Criterion = c.Criterion,
                    })
                    .ToList(),
            };
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error retrieving assessment criteria for project {ProjectId}", request.ProjectId);
            return ErrorCode.DatabaseError;
        }
    }
}
