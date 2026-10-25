using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetAllProjectVersions;
using Projects.Contracts.Features.GetProject;
using RawLLMOutputs.Data;
using RawLLMOutputs.Features.DeleteRawLLMOuput;
using Serilog;
using Shared;

namespace RawLLMOutputs.Features.DeleteRawLLMData
{
    public class DeleteRawLLMOutputHandler : IRequestHandler<DeleteRawLLMOutputRequest, Result<DeleteRawLLMOutputResponse>>
    {
        private static readonly ILogger Logger = Log.ForContext<DeleteRawLLMOutputHandler>();
        private readonly RawLLMOutputDbContext _rawLLMOutputDbContext;
        private readonly IMediator _mediator;

        public DeleteRawLLMOutputHandler(RawLLMOutputDbContext rawLLMOutputDbContext, IMediator mediator)
        {
            _rawLLMOutputDbContext = rawLLMOutputDbContext;
            _mediator = mediator;
        }

        public async ValueTask<Result<DeleteRawLLMOutputResponse>> Handle(
            DeleteRawLLMOutputRequest request,
            CancellationToken cancellationToken
        )
        {
            var getProjectQuery = new GetProjectQuery { ProjectId = request.ProjectId, UserId = request.UserId };
            var getProjectResult = await _mediator.Send(getProjectQuery, cancellationToken);

            if (!getProjectResult.IsSuccess)
            {
                Logger.Warning(
                    "Failed to retrieve project {ProjectId} for user {UserId}. Error: {ErrorCode}",
                    request.ProjectId,
                    request.UserId,
                    getProjectResult.ErrorCode
                );
                return getProjectResult.ErrorCode!.Value;
            }

            var getProjectVersionsQuery = new GetAllProjectVersionsQuery { ProjectId = request.ProjectId };
            var getProjectVersionsResult = await _mediator.Send(getProjectVersionsQuery, cancellationToken);

            if (!getProjectVersionsResult.IsSuccess)
            {
                Logger.Warning(
                    "Failed to retrieve project versions for project {ProjectId}. Error: {ErrorCode}",
                    request.ProjectId,
                    getProjectVersionsResult.ErrorCode
                );
                return getProjectVersionsResult.ErrorCode;
            }

            try
            {
                var exists = await _rawLLMOutputDbContext
                    .RawLLMOutputs.Where(c => c.RawLLMOutputId == request.RawLLMOutputId && c.VersionId == request.ProjectVersionId)
                    .AnyAsync(cancellationToken);

                if (!exists)
                {
                    return ErrorCode.EntityNotFound;
                }
            }
            catch (Exception ex)
            {
                Logger.Error(
                    ex,
                    "Error checking if raw LLM ouput {RawLLMOutputId} exists for projectversion {ProjectVersionId}.",
                    request.RawLLMOutputId,
                    request.ProjectVersionId
                    );
                return ErrorCode.DatabaseError;
            }

            int changes;
            try
            {
                changes = await _rawLLMOutputDbContext.RawLLMOutputs
                    .Where(c => c.RawLLMOutputId == request.RawLLMOutputId && c.VersionId == request.ProjectVersionId)
                    .ExecuteDeleteAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                Logger.Error(
                    ex,
                    "Error deleting raw LLM output {RawLLMOutputId} for projectversion {ProjectVersionId}.",
                    request.RawLLMOutputId,
                    request.ProjectVersionId
                );
                return ErrorCode.DatabaseError;
            }

            if (changes > 0)
            {
                return new DeleteRawLLMOutputResponse();
            }

            return ErrorCode.NoChanges;

        }
    }
}
