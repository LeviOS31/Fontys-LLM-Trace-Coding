using System.Data.Common;
using AxialCodes.Data;
using JudgeTemplates.Contracts.Features.SetAllJudgeTemplatesToDeprecated;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Projects.Contracts.Features.GetProject;
using Serilog;
using Shared;

namespace AxialCodes.Features.SaveAxialCodes;

public class SaveAxialCodesHandler : IRequestHandler<SaveAxialCodesRequest, Result<SaveAxialCodesResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<SaveAxialCodesHandler>();
    private readonly IMediator _mediator;
    private readonly AxialCodeDbContext _dbContext;

    public SaveAxialCodesHandler(IMediator mediator, AxialCodeDbContext dbContext)
    {
        _mediator = mediator;
        _dbContext = dbContext;
    }

    public async ValueTask<Result<SaveAxialCodesResponse>> Handle(
        SaveAxialCodesRequest request,
        CancellationToken cancellationToken
    )
    {
        // Permission validation
        var getProjectResult = await _mediator.Send(
            new GetProjectQuery { UserId = request.UserId, ProjectId = request.ProjectId },
            cancellationToken
        );

        if (getProjectResult.IsError)
        {
            return getProjectResult.ErrorCode!;
        }

        // Is the version part of the project?
        var doesProjectContainVersion =
            getProjectResult.Value.Versions.Find(v => v.VersionId == request.ProjectVersionId) != null;
        if (!doesProjectContainVersion)
        {
            return ErrorCode.InvalidRequest;
        }

        // Execute
        try
        {
            // Get the target axial coding result
            var targetResult = await _dbContext.AxialCodingResults.FirstOrDefaultAsync(
                a =>
                    a.ProjectVersionId == request.ProjectVersionId
                    && a.AxialCodingResultId == request.AxialCodingResultId,
                cancellationToken
            );

            if (targetResult is null)
            {
                return ErrorCode.EntityNotFound;
            }

            // Get active results
            var activeResults = await _dbContext
                .AxialCodingResults.Where(a =>
                    a.ProjectVersionId == request.ProjectVersionId
                    && a.IsActive
                    && a.AxialCodingResultId != request.AxialCodingResultId
                )
                .ToListAsync(cancellationToken);

            // Transaction to change the active result
            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

            if (activeResults.Count > 0)
            {
                foreach (var activeResult in activeResults)
                {
                    activeResult.IsActive = false;
                }

                // First save, otherwise we get constraint violations
                await _dbContext.SaveChangesAsync(cancellationToken);

                await _mediator.Send(
                    new SetAllJudgeTemplatesToDeprecatedRequest
                    {
                        ProjectId = request.ProjectId,
                        ProjectVersionId = request.ProjectVersionId,
                    },
                    cancellationToken
                );
            }

            if (!targetResult.IsActive)
            {
                targetResult.IsActive = true;
                var activationChanges = await _dbContext.SaveChangesAsync(cancellationToken);
                if (activationChanges == 0)
                {
                    return ErrorCode.NoChanges;
                }
            }

            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error saving axial codes for project version {ProjectVersionId}",
                request.ProjectVersionId
            );
            return ErrorCode.DatabaseError;
        }

        return new SaveAxialCodesResponse();
    }
}
