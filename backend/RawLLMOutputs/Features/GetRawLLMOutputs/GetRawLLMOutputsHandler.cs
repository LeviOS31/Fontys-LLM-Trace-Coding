using Mediator;
using Microsoft.EntityFrameworkCore;
using RawLLMOutputs.Contracts.Features.GetRawLLMOutput;
using RawLLMOutputs.Contracts.Features.GetRawLLMOutputs;
using RawLLMOutputs.Data;
using RawLLMOutputs.Data.Models;
using Serilog;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Features.GetRawLLMOutputs
{
    public class GetRawLLMOutputsHandler: IRequestHandler<GetRawLLMOutputsRequest, Result<GetRawLLMOutputsResponse>>
    {
        private static readonly ILogger Logger = Log.ForContext<GetRawLLMOutputsHandler>();
        private readonly RawLLMOutputDbContext _dbContext;
        private readonly IMediator _mediator;

        public GetRawLLMOutputsHandler(RawLLMOutputDbContext dbContext, IMediator mediator)
        {
            _dbContext = dbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<GetRawLLMOutputsResponse>> Handle(
            GetRawLLMOutputsRequest request,
            CancellationToken cancellationToken
        )
        {
            List<RawLLMOutput> rawLLMOutputs = new List<RawLLMOutput>();

            try
            {
                rawLLMOutputs = await _dbContext
                    .RawLLMOutputs.Where(r => request.RawLLMOutputIds.Contains(r.RawLLMOutputId))
                    .ToListAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error occurred while fetching RawLLMOutputs");
                return ErrorCode.DatabaseError;
            }

            if (rawLLMOutputs.Count == 0)
            {
                return ErrorCode.EntityNotFound;
            }

            return new GetRawLLMOutputsResponse
            {
                RawLLMOutputs = rawLLMOutputs.Select(r => new GetRawLLMOutputResponse
                {
                    RawLLMOutputId = r.RawLLMOutputId,
                    VersionId = r.VersionId,
                    Name = r.Name,
                    Output = r.Output,
                    CreatedAt = r.CreatedAt
                }).ToList()
            };
        }

    }
}
