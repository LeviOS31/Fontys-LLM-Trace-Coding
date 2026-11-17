using Judge.Data;
using Judge.Data.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetAllProjectVersions;
using Serilog;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace Judge.Features.GetAllJudgeCollectionsByVersion
{
    public class GetAllJudgeCollectionsByVersionHandler : IRequestHandler<GetAllJudgeCollectionsByVersionRequest, Result<GetAllJudgeCollectionsByVersionResponse>>
    {
        private static readonly ILogger logger = Log.ForContext<GetAllJudgeCollectionsByVersionHandler>();
        private readonly JudgeDbContext _dbContext;
        private readonly IMediator _mediator;

        public GetAllJudgeCollectionsByVersionHandler(JudgeDbContext dbContext, IMediator mediator)
        {
            _dbContext = dbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<GetAllJudgeCollectionsByVersionResponse>> Handle(
            GetAllJudgeCollectionsByVersionRequest request,
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
                var judgecollections = await _dbContext.JudgeCollections
                     .Where(c => c.ProjectVersionId == request.VersionId)
                     .ToListAsync(cancellationToken);

                Dictionary<Guid, int> runcount = new Dictionary<Guid, int>();
                Dictionary<Guid, int> tracecounts = new Dictionary<Guid, int>();
                Dictionary<Guid, int> succescounts = new Dictionary<Guid, int>();
                Dictionary<Guid, int> failcounts = new Dictionary<Guid, int>();

                foreach ( var judgecollection in judgecollections)
                {
                    List<JudgeRun> judgeruns = await _dbContext.JudgeRuns
                         .Where(c => c.JudgeCollectionId == judgecollection.JudgeCollectionId)
                         .ToListAsync(cancellationToken);

                    runcount.Add(judgecollection.JudgeCollectionId, judgeruns.Count());
                    tracecounts.Add(judgecollection.JudgeCollectionId, judgeruns.Sum(x => x.TotalCount));
                    succescounts.Add(judgecollection.JudgeCollectionId, judgeruns.Sum(x => x.TrueCount));
                    failcounts.Add(judgecollection.JudgeCollectionId, judgeruns.Sum(x => x.FalseCount));
                }

                return new GetAllJudgeCollectionsByVersionResponse
                {
                    JudgeCollections = judgecollections.Select(c => new JudgeCollection
                    {
                        JudgeCollectionId = c.JudgeCollectionId,
                        Name = c.Name,
                        RunCount = runcount[c.JudgeCollectionId],
                        TraceCount = tracecounts[c.JudgeCollectionId],
                        SuccesCount = succescounts[c.JudgeCollectionId],
                        FailCount = failcounts[c.JudgeCollectionId],
                        VersionId = c.ProjectVersionId,
                        CreatedAt = c.CreatedAt
                    })
                };
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Error loading judge collections for projectversion {VersionId}", request.VersionId);
                return ErrorCode.DatabaseError;
            }
        }
    }
}
