using Judge.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetAllProjectVersions;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;

namespace Judge.Features.DeleteJudgeRun;

public class DeleteJudgeRunHandler : IRequestHandler<DeleteJudgeRunRequest, Result<DeleteJudgeRunResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<DeleteJudgeRunHandler>();

    private readonly JudgeDbContext _dbContext;
    private readonly IMediator _mediator;

    public DeleteJudgeRunHandler(JudgeDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<DeleteJudgeRunResponse>> Handle(
        DeleteJudgeRunRequest request,
        CancellationToken cancellationToken
    )
    {
        var judgecollection = await _dbContext.JudgeCollections.
            Where(j => j.JudgeCollectionId == request.JudgeCollectionId && j.ProjectVersionId == request.ProjectVersionId).
            FirstOrDefaultAsync(
                cancellationToken
            );

        if (judgecollection is null)
        {
            return ErrorCode.EntityNotFound;
        }

        var getAllVersionRequest = new GetAllProjectVersionsQuery
        {
            ProjectId = request.ProjectId,
        };

        var getAllVersionResult = await _mediator.Send(getAllVersionRequest, cancellationToken);

        if (!getAllVersionResult.IsSuccess)
        {
            return getAllVersionResult.ErrorCode;
        }

        if (!getAllVersionResult.Value.Versions.Any(v => v.VersionId == request.ProjectVersionId))
        {
            return ErrorCode.EntityNotFound;
        }

        try
        {
            var run = await _dbContext.JudgeRuns.FirstOrDefaultAsync(
                r =>
                    r.JudgeRunId == request.JudgeRunId,
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