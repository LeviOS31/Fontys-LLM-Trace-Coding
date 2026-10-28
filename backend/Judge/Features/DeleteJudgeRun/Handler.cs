using Judge.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace Judge.Features.DeleteJudgeRun;

public class DeleteJudgeRunHandler : IRequestHandler<DeleteJudgeRunRequest, Result<DeleteJudgeRunResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<DeleteJudgeRunHandler>();

    private readonly JudgeDbContext _dbContext;

    public DeleteJudgeRunHandler(JudgeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async ValueTask<Result<DeleteJudgeRunResponse>> Handle(
        DeleteJudgeRunRequest request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var run = await _dbContext.JudgeRuns.FirstOrDefaultAsync(
                r =>
                    r.JudgeRunId == request.JudgeRunId
                    && r.ProjectId == request.ProjectId
                    && r.ProjectVersionId == request.ProjectVersionId,
                cancellationToken
            );
            if (run is null)
            {
                return ErrorCode.EntityNotFound;
            }

            _dbContext.JudgeRuns.Remove(run);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return new DeleteJudgeRunResponse { JudgeRunId = request.JudgeRunId };
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "Error deleting judge run {JudgeRunId}", request.JudgeRunId);
            return ErrorCode.DatabaseError;
        }
    }
}