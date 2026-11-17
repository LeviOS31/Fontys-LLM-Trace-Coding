using Judge.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetAllProjectVersions;
using Serilog;
using Shared;

namespace Judge.Features.GetJudgeCollection
{
    public class GetJudgeCollectionHandler : IRequestHandler<GetJudgeCollectionRequest, Result<GetJudgeCollectionResponse>>
    {
        private static readonly ILogger logger = Log.ForContext<GetJudgeCollectionHandler>();
        private readonly JudgeDbContext _dbContext;
        private readonly IMediator _mediator;

        public GetJudgeCollectionHandler(JudgeDbContext dbContext, IMediator mediator)
        {
            _dbContext = dbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<GetJudgeCollectionResponse>> Handle(
            GetJudgeCollectionRequest request,
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

            if (!getAllVersionResult.Value.Versions.Any(v => v.VersionId == request.VersionId))
            {
                return ErrorCode.EntityNotFound;
            }

            try
            {
                var judgecollection = await _dbContext.JudgeCollections
                    .Where(c => c.JudgeCollectionId == request.JudgeCollectionId)
                    .FirstOrDefaultAsync(cancellationToken);

                return new GetJudgeCollectionResponse
                {
                    JudgeCollectionId = judgecollection.JudgeCollectionId,
                    Name = judgecollection.Name,
                    VersionId = judgecollection.ProjectVersionId,
                    CreatedAt = judgecollection.CreatedAt
                };
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Error occurred while retrieving judge collection with ID {JudgeCollectionId}", request.JudgeCollectionId);
                return ErrorCode.DatabaseError;
            }
        }
    }
}
