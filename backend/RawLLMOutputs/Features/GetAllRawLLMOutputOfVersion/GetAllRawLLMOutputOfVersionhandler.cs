using Mediator;
using Microsoft.EntityFrameworkCore;
using OllamaSharp.Models;
using RawLLMOutputs.Contracts.Features.GetAllRawLLMOutputOfVersion;
using RawLLMOutputs.Contracts.Features.GetRawLLMOutput;
using RawLLMOutputs.Data;
using Serilog;
using Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Features.GetAllRawLLMOutputOfVersion
{
    public class GetAllRawLLMOutputOfVersionhandler: IRequestHandler<GetAllRawLLMOutputOfVersionQuery, Result<GetAllRawLLMOutputOfVersionResponse>>
    {
        private static readonly ILogger Logger = Log.ForContext<GetAllRawLLMOutputOfVersionhandler>();
        private readonly IMediator _mediator;
        private readonly RawLLMOutputDbContext _rawLLMOutputDbContext;

        public GetAllRawLLMOutputOfVersionhandler(IMediator mediator, RawLLMOutputDbContext rawLLMOutputDbContext)
        {
            _mediator = mediator;
            _rawLLMOutputDbContext = rawLLMOutputDbContext;
        }

        public async ValueTask<Result<GetAllRawLLMOutputOfVersionResponse>> Handle(
            GetAllRawLLMOutputOfVersionQuery query,
            CancellationToken cancellationToken
        )
        {
            try
            {
                var rawLLMOutputs = await _rawLLMOutputDbContext.RawLLMOutputs
                    .AsNoTracking().Where(r => r.VersionId == query.VersionId)
                    .ToListAsync(cancellationToken);

                return new GetAllRawLLMOutputOfVersionResponse
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
            catch( Exception ex )
            {
                Logger.Error(ex, "Error retrieving all raw LLM outputs of version {ID}", query.VersionId);
                return ErrorCode.DatabaseError;
            }
        }
    }
}
