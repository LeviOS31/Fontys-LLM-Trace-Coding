using Mediator;
using Microsoft.EntityFrameworkCore;
using RawLLMOutputs.Contracts.Features.GetRawLLMOutput;
using RawLLMOutputs.Data;
using RawLLMOutputs.Data.Models;
using Serilog;
using Shared;

namespace RawLLMOutputs.Features.GetRawLLMOutput
{
    public class GetRawLLMOutputHandler : IRequestHandler<GetRawLLMOutputQuery, Result<GetRawLLMOutputResponse>>
    {
        private static readonly ILogger Logger = Log.ForContext<GetRawLLMOutputHandler>();
        private readonly RawLLMOutputDbContext _dbContext;
        private readonly IMediator _mediator;

        public GetRawLLMOutputHandler(RawLLMOutputDbContext dbContext, IMediator mediator)
        {
            _dbContext = dbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<GetRawLLMOutputResponse>> Handle(
            GetRawLLMOutputQuery query,
            CancellationToken cancellationToken
        )
        {
            RawLLMOutput? rawLLMOutput;

            try
            {
                rawLLMOutput = await _dbContext
                    .RawLLMOutputs.AsNoTracking()
                    .FirstOrDefaultAsync(r => r.RawLLMOutputId == query.RawLLMOutputId, cancellationToken);
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error occurred while fetching RawLLMOutput {Id}", query.RawLLMOutputId);
                return ErrorCode.DatabaseError;
            }

            if (rawLLMOutput == null)
            {
                Logger.Warning("RawLLMOutput not found for Id {Id}", query.RawLLMOutputId);
                return ErrorCode.EntityNotFound;
            }

            return new GetRawLLMOutputResponse
            {
                RawLLMOutputId = rawLLMOutput.RawLLMOutputId,
                VersionId = rawLLMOutput.VersionId,
                Name = rawLLMOutput.Name,
                Output = rawLLMOutput.Output,
                CreatedAt = rawLLMOutput.CreatedAt
            };

        }
    }
}
