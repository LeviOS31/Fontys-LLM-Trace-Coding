using System.Data.Common;
using AxialCodes.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;

namespace AxialCodes.Features.UpdateAxialCodeFeedback;

public class UpdateAxialCodeFeedbackHandler
    : IRequestHandler<UpdateAxialCodeFeedbackRequest, Result<UpdateAxialCodeFeedbackResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<UpdateAxialCodeFeedbackHandler>();
    private readonly AxialCodeDbContext _dbContext;
    private readonly IMediator _mediator;

    public UpdateAxialCodeFeedbackHandler(AxialCodeDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<UpdateAxialCodeFeedbackResponse>> Handle(
        UpdateAxialCodeFeedbackRequest request,
        CancellationToken cancellationToken
    )
    {
        var getProjectResult = await _mediator.Send(
            new GetProjectQuery { UserId = request.UserId, ProjectId = request.ProjectId },
            cancellationToken
        );
        if (getProjectResult.IsError)
        {
            return getProjectResult.ErrorCode!;
        }

        var doesProjectContainVersion =
            getProjectResult.Value.Versions.Find(v => v.VersionId == request.ProjectVersionId) != null;
        if (!doesProjectContainVersion)
        {
            return ErrorCode.InvalidRequest;
        }

        try
        {
            var axialCode = await _dbContext
                .AxialCodingResults.Where(a => a.ProjectVersionId == request.ProjectVersionId && a.IsActive)
                .SelectMany(a => a.AxialCodes)
                .FirstOrDefaultAsync(a => a.AxialCodeId == request.AxialCodeId, cancellationToken);

            if (axialCode is null)
            {
                return ErrorCode.EntityNotFound;
            }

            axialCode.Feedback = request.Feedback;
            var changes = await _dbContext.SaveChangesAsync(cancellationToken);
            if (changes == 0)
            {
                return ErrorCode.NoChanges;
            }
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error updating feedback for axial code {AxialCodeId}", request.AxialCodeId);
            return ErrorCode.DatabaseError;
        }

        return new UpdateAxialCodeFeedbackResponse();
    }
}