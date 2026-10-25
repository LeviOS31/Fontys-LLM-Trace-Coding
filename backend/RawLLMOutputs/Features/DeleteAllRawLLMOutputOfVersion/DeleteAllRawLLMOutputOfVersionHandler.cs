using Mediator;
using Microsoft.EntityFrameworkCore;
using RawLLMOutputs.Contracts.Features.DeleteAllRawLLMOutputOfVersion;
using RawLLMOutputs.Data;
using Serilog;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Features.DeleteAllRawLLMOutputOfVersion
{
    public class DeleteAllRawLLMOutputOfVersionHandler
        :IRequestHandler<DeleteAllRawLLMOutputOfVersionQuery,
        Result<DeleteAllRawLLMOutputOfVersionResponse>>
    {
        private static readonly ILogger logger = Log.ForContext<DeleteAllRawLLMOutputOfVersionHandler>();
        private readonly IMediator _mediator;
        private readonly RawLLMOutputDbContext _rawLLMOutputDbContext;

        public DeleteAllRawLLMOutputOfVersionHandler(RawLLMOutputDbContext rawLLMOutputDbContext, IMediator mediator)
        {
            _rawLLMOutputDbContext = rawLLMOutputDbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<DeleteAllRawLLMOutputOfVersionResponse>> Handle(
            DeleteAllRawLLMOutputOfVersionQuery request,
            CancellationToken cancellationToken
        )
        {

            int changes = 0;
            try
            {
                changes = await _rawLLMOutputDbContext.RawLLMOutputs
                    .Where(x => x.VersionId == request.VersionId)
                    .ExecuteDeleteAsync(cancellationToken);
            }
            catch (Exception ex)
            { 
                logger.Error(ex, "Error deleting RawLLMOutputs for VersionId: {VersionId}", request.VersionId);
                return ErrorCode.DatabaseError;
            }

            if (changes > 0)
            {
                return new DeleteAllRawLLMOutputOfVersionResponse();
            }

            return ErrorCode.NoChanges;
        }
    }
}
