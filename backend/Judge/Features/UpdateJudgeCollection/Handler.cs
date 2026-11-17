using Judge.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetAllProjectVersions;
using Serilog;
using Shared;
using System.Data.Common;

namespace Judge.Features.UpdateJudgeCollection;

public class UpdateJudgeCollectionHandler
    : IRequestHandler<UpdateJudgeCollectionRequest, Result<UpdateJudgeCollectionResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<UpdateJudgeCollectionHandler>();

    private readonly JudgeDbContext _dbContext;
    private readonly IMediator _mediator;

    public UpdateJudgeCollectionHandler(JudgeDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<UpdateJudgeCollectionResponse>> Handle(
        UpdateJudgeCollectionRequest request,
        CancellationToken cancellationToken
    )
    {
        var versionsResult = await _mediator.Send(
            new GetAllProjectVersionsQuery { ProjectId = request.ProjectId },
            cancellationToken
        );

        if (!versionsResult.IsSuccess)
        {
            return versionsResult.ErrorCode!.Value;
        }

        if (!versionsResult.Value.Versions.Any(version => version.VersionId == request.ProjectVersionId))
        {
            return ErrorCode.EntityNotFound;
        }

        try
        {
            var collection = await _dbContext.JudgeCollections.FirstOrDefaultAsync(
                item =>
                    item.JudgeCollectionId == request.JudgeCollectionId
                    && item.ProjectVersionId == request.ProjectVersionId,
                cancellationToken
            );

            if (collection is null)
            {
                return ErrorCode.EntityNotFound;
            }

            collection.Name = request.Name.Trim();
            await _dbContext.SaveChangesAsync(cancellationToken);

            return new UpdateJudgeCollectionResponse
            {
                JudgeCollectionId = collection.JudgeCollectionId,
                Name = collection.Name,
            };
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error updating judge collection {JudgeCollectionId}", request.JudgeCollectionId);
            return ErrorCode.DatabaseError;
        }
    }
}