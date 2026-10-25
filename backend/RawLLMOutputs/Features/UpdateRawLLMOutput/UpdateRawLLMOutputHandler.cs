using Mediator;
using Microsoft.EntityFrameworkCore;
using RawLLMOutputs.Data;
using RawLLMOutputs.Data.Models;
using Serilog;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Features.UpdateRawLLMOutput
{
    public class UpdateRawLLMOutputHandler
        :IRequestHandler<UpdateRawLLMOutputRequest, Result<UpdateRawLLMOutputResponse>>
    {
        private static readonly ILogger logger = Log.ForContext<UpdateRawLLMOutputHandler>();
        private readonly IMediator _mediator;
        private readonly RawLLMOutputDbContext _rawLLMOutputDbContext;

        public UpdateRawLLMOutputHandler(IMediator mediator, RawLLMOutputDbContext rawLLMOutputDbContext)
        {
            _mediator = mediator;
            _rawLLMOutputDbContext = rawLLMOutputDbContext;
        }

        public async ValueTask<Result<UpdateRawLLMOutputResponse>> Handle(
            UpdateRawLLMOutputRequest request,
            CancellationToken cancellationToken
        )
        {
            RawLLMOutput? rawLLMOutput;
            try
            {
                rawLLMOutput = await _rawLLMOutputDbContext.
                    RawLLMOutputs.FirstOrDefaultAsync(
                    v => v.RawLLMOutputId == request.RawLLMOutputId,
                    cancellationToken
                    );
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Error updating RawLLMOutput with ID {RawLLMOutputId}", request.RawLLMOutputId);
                return ErrorCode.DatabaseError;
            }

            if (rawLLMOutput == null)
            {
                logger.Warning("RawLLMOutput with ID {RawLLMOutputId} not found", request.RawLLMOutputId);
                return ErrorCode.EntityNotFound;
            }

            rawLLMOutput.Name = request.Name;

            try
            {
                await _rawLLMOutputDbContext.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Error saving changes for RawLLMOutput with ID {RawLLMOutputId}", request.RawLLMOutputId);
                return ErrorCode.DatabaseError;
            }

            return new UpdateRawLLMOutputResponse
            {
                RawLLMOutputId = rawLLMOutput.RawLLMOutputId,
                VersionId = rawLLMOutput.VersionId,
                Name = request.Name,
                Output = rawLLMOutput.Output,
                CreatedAt = rawLLMOutput.CreatedAt
            };
        }
    }
}
