using System.Data.Common;
using AxialCodes.Data;
using JudgeTemplates.Contracts.Features.DeleteJudgeTemplatesOfAxialCodes;
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

            // Once approved, the target replaces every other result of this version:
            // the previously approved one and any draft that was never approved.
            var oldResults = await _dbContext
                .AxialCodingResults.Include(a => a.AxialCodes)
                .Where(a =>
                    a.ProjectVersionId == request.ProjectVersionId
                    && a.AxialCodingResultId != request.AxialCodingResultId
                )
                .ToListAsync(cancellationToken);

            var oldAxialCodeIds = oldResults.SelectMany(r => r.AxialCodes).Select(c => c.AxialCodeId).ToList();

            // Delete their judge templates first, so no template is ever left pointing to a deleted axial code.
            if (oldAxialCodeIds.Count > 0)
            {
                var deleteTemplatesResult = await _mediator.Send(
                    new DeleteJudgeTemplatesOfAxialCodesRequest
                    {
                        ProjectId = request.ProjectId,
                        ProjectVersionId = request.ProjectVersionId,
                        AxialCodeIds = oldAxialCodeIds,
                    },
                    cancellationToken
                );
                if (deleteTemplatesResult.IsError)
                {
                    return deleteTemplatesResult.ErrorCode!.Value;
                }
            }

            // Transaction to change the active result
            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

            if (oldResults.Count > 0)
            {
                // Their axial codes and open code justifications are removed by cascade.
                _dbContext.AxialCodingResults.RemoveRange(oldResults);

                // First save, otherwise activating the target violates the one-active-result index
                await _dbContext.SaveChangesAsync(cancellationToken);
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
