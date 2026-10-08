using Mediator;
using Projects.Contracts.Features.GetAllProjectVersions;
using Projects.Contracts.Features.GetProject;
using RawLLMOutputs.Data;
using RawLLMOutputs.Data.Models;
using Serilog;
using Shared;

namespace RawLLMOutputs.Features.ImportRawLLMData
{
    public class ImportRawLLMOutputHandler : IRequestHandler<ImportRawLLMOutputRequest, Result<ImportRawLLMOutputResponse>>
    {
        private static readonly ILogger Logger = Log.ForContext<ImportRawLLMOutputHandler>();
        private readonly IMediator _mediator;
        private readonly RawLLMOutputDbContext _dbContext;

        public ImportRawLLMOutputHandler(IMediator mediator, RawLLMOutputDbContext dbContext)
        {
            _mediator = mediator;
            _dbContext = dbContext;
        }

        public async ValueTask<Result<ImportRawLLMOutputResponse>> Handle(
            ImportRawLLMOutputRequest request,
            CancellationToken cancellationToken
        )
        {
            var getProjectQuery = new GetProjectQuery { ProjectId = request.ProjectId };
            var result = await _mediator.Send(getProjectQuery, cancellationToken);

            if (!result.IsSuccess)
            {
                Logger.Warning(
                    "Failed to retrieve project {ProjectId} for user {UserId}. Error: {ErrorCode}",
                    request.ProjectId,
                    request.UserId,
                    result.ErrorCode
                );
                return result.ErrorCode;
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

            if (
                getProjectVersionsResult.Value.Versions.Find(version => version.VersionId == request.ProjectVersionId)
                == null
            )
            {
                Logger.Warning(
                    "Project version {ProjectVersionId} not found for project {ProjectId}",
                    request.ProjectVersionId,
                    request.ProjectId
                );
                return ErrorCode.EntityNotFound;
            }

            if (request.File.ContentType != "application/json")
            {
                Logger.Warning(
                    "Invalid file type {ContentType} for project {ProjectId}",
                    request.File.ContentType,
                    request.ProjectId
                );
                return ErrorCode.UnsupportedFileType;
            }

            var rawLLMOutput = new RawLLMOutput
            {
                RawLLMOutputId = Guid.NewGuid(),
                VersionId = request.ProjectVersionId,
                Output = request.File,
                CreatedAt = DateTime.UtcNow
            };

        }
    }
}
