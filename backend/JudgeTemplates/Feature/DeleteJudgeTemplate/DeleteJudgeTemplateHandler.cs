using System.Data.Common;
using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace JudgeTemplates.Feature.DeleteJudgeTemplate;

public class DeleteJudgeTemplateHandler
    : IRequestHandler<DeleteJudgeTemplateRequest, Result<DeleteJudgeTemplateResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<DeleteJudgeTemplateHandler>();
    private readonly JudgeTemplatesDbContext _dbContext;
    private readonly IMediator _mediator;

    public DeleteJudgeTemplateHandler(JudgeTemplatesDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<DeleteJudgeTemplateResponse>> Handle(
        DeleteJudgeTemplateRequest request,
        CancellationToken cancellationToken
    )
    {
        // Validates user access to the project and that the version belongs to the project
        var axialCodesResponse = await _mediator.Send(
            new InternalGetAllAxialCodesByVersionRequest
            {
                ProjectId = request.ProjectId,
                ProjectVersionId = request.ProjectVersionId,
                UserId = request.UserId,
            },
            cancellationToken
        );

        if (axialCodesResponse.IsError)
        {
            return axialCodesResponse.ErrorCode!.Value;
        }

        bool exists;
        try
        {
            exists = await _dbContext.JudgeTemplates.AnyAsync(
                jt =>
                    jt.JudgeTemplateId == request.JudgeTemplateId
                    && jt.ProjectId == request.ProjectId
                    && jt.ProjectVersionId == request.ProjectVersionId,
                cancellationToken
            );
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error checking if judge template {JudgeTemplateId} exists for project version {ProjectVersionId}",
                request.JudgeTemplateId,
                request.ProjectVersionId
            );
            return ErrorCode.DatabaseError;
        }

        if (!exists)
        {
            return ErrorCode.EntityNotFound;
        }

        int changes;
        try
        {
            changes = await _dbContext
                .JudgeTemplates.Where(jt =>
                    jt.JudgeTemplateId == request.JudgeTemplateId
                    && jt.ProjectId == request.ProjectId
                    && jt.ProjectVersionId == request.ProjectVersionId
                )
                .ExecuteDeleteAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error deleting judge template {JudgeTemplateId} for project version {ProjectVersionId}",
                request.JudgeTemplateId,
                request.ProjectVersionId
            );
            return ErrorCode.DatabaseError;
        }

        if (changes == 0)
        {
            return ErrorCode.NoChanges;
        }

        return new DeleteJudgeTemplateResponse();
    }
}
