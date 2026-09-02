using System.Data.Common;
using AssessmentCriteria.Contracts.Features.InternalDeleteAllAssessmentCriteriaOfProject;
using AssessmentCriteria.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace AssessmentCriteria.Features.InternalDeleteAllAssessmentCriteriaOfProject;

public class InternalDeleteAllAssessmentCriteriaOfProjectHandler
    : IRequestHandler<
        InternalDeleteAllAssessmentCriteriaOfProjectRequest,
        Result<InternalDeleteAllAssessmentCriteriaOfProjectResponse>
    >
{
    private static readonly ILogger Logger = Log.ForContext<InternalDeleteAllAssessmentCriteriaOfProjectHandler>();
    private readonly AssessmentCriteriaDbContext _assessmentCriteriaDbContext;

    public InternalDeleteAllAssessmentCriteriaOfProjectHandler(AssessmentCriteriaDbContext assessmentCriteriaDbContext)
    {
        _assessmentCriteriaDbContext = assessmentCriteriaDbContext;
    }

    public async ValueTask<Result<InternalDeleteAllAssessmentCriteriaOfProjectResponse>> Handle(
        InternalDeleteAllAssessmentCriteriaOfProjectRequest request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var changes = await _assessmentCriteriaDbContext
                .AssessmentCriteria.Where(c => c.ProjectId == request.ProjectId)
                .ExecuteDeleteAsync(cancellationToken);

            if (changes > 0)
            {
                return new InternalDeleteAllAssessmentCriteriaOfProjectResponse();
            }

            return ErrorCode.NoChanges;
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error deleting assessment criteria for project {ProjectId}", request.ProjectId);
            return ErrorCode.DatabaseError;
        }
    }
}
