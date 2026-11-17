using Judge.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetAllProjectVersions;
using Serilog;
using Shared;

namespace Judge.Features.DeleteJudgeCollection
{
    public class DeleteJudgeCollectionHandler : IRequestHandler<DeleteJudgeCollectionRequest, Result<DeleteJudgeCollectionResponse>>
    {
        private static readonly ILogger Logger = Log.ForContext<DeleteJudgeCollectionHandler>();
        private readonly JudgeDbContext _dbContext;
        private readonly IMediator _mediator;

        public DeleteJudgeCollectionHandler(JudgeDbContext dbContext, IMediator mediator)
        {
            _dbContext = dbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<DeleteJudgeCollectionResponse>> Handle(
            DeleteJudgeCollectionRequest request,
            CancellationToken cancellationToken
        )
        {
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
                var judgecollection = await _dbContext.JudgeCollections
                    .Where(c => c.JudgeCollectionId == request.JudgeCollectionId)
                    .FirstOrDefaultAsync(cancellationToken);

                if (judgecollection is null)
                {
                    return ErrorCode.EntityNotFound;
                }

                _dbContext.JudgeCollections.Remove(judgecollection);
                await _dbContext.SaveChangesAsync(cancellationToken);

                return new DeleteJudgeCollectionResponse
                {
                    JudgeCollectionId = request.JudgeCollectionId
                };
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error occurred while deleting judge collection with ID {JudgeCollectionId}", request.JudgeCollectionId);
                return ErrorCode.DatabaseError;
            }
        }
    }
}
