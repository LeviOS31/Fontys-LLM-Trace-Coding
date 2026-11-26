using System.Data.Common;
using Judge.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;

namespace Judge.Features.UpdateJudgeRunFeedback;

public class UpdateJudgeRunFeedbackHandler
    : IRequestHandler<UpdateJudgeRunFeedbackRequest, Result<UpdateJudgeRunFeedbackResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<UpdateJudgeRunFeedbackHandler>();
    private readonly JudgeDbContext _dbContext;
    private readonly IMediator _mediator;

    public UpdateJudgeRunFeedbackHandler(JudgeDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<UpdateJudgeRunFeedbackResponse>> Handle(
        UpdateJudgeRunFeedbackRequest request,
        CancellationToken cancellationToken
    )
    {
        var projectResult = await _mediator.Send(
            new GetProjectQuery { UserId = request.UserId, ProjectId = request.ProjectId },
            cancellationToken
        );
        if (projectResult.IsError)
        {
            return projectResult.ErrorCode!;
        }

        if (projectResult.Value.Versions.Find(v => v.VersionId == request.ProjectVersionId) is null)
        {
            return ErrorCode.InvalidRequest;
        }

        try
        {
            var run = await _dbContext.JudgeRuns.FirstOrDefaultAsync(
                r =>
                    r.JudgeRunId == request.JudgeRunId
                    && r.JudgeCollectionId == request.JudgeCollectionId
                    && r.JudgeCollection.ProjectVersionId == request.ProjectVersionId,
                cancellationToken
            );
            if (run is null)
            {
                return ErrorCode.EntityNotFound;
            }

            var feedback = request.Feedback.Trim();
            run.Feedback = feedback.Length == 0 ? null : feedback;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error updating feedback for judge run {JudgeRunId}", request.JudgeRunId);
            return ErrorCode.DatabaseError;
        }

        return new UpdateJudgeRunFeedbackResponse();
    }
}