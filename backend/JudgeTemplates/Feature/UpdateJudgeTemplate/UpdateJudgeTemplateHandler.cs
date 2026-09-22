using System.Data.Common;
using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace JudgeTemplates.Feature.UpdateJudgeTemplate;

public class UpdateJudgeTemplateHandler
    : IRequestHandler<UpdateJudgeTemplateRequest, Result<UpdateJudgeTemplateResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<UpdateJudgeTemplateHandler>();
    private readonly JudgeTemplatesDbContext _dbContext;
    private readonly IMediator _mediator;

    public UpdateJudgeTemplateHandler(JudgeTemplatesDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<UpdateJudgeTemplateResponse>> Handle(
        UpdateJudgeTemplateRequest request,
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

        JudgeTemplates.Data.Models.JudgeTemplate? judgeTemplate;
        try
        {
            judgeTemplate = await _dbContext.JudgeTemplates.FirstOrDefaultAsync(
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
                "Error fetching judge template {JudgeTemplateId} for project version {ProjectVersionId}",
                request.JudgeTemplateId,
                request.ProjectVersionId
            );
            return ErrorCode.DatabaseError;
        }

        if (judgeTemplate is null)
        {
            return ErrorCode.EntityNotFound;
        }

        judgeTemplate.CustomJudgeTemplateContent = request.Content;
        judgeTemplate.IsDeprecated = false; // user has reviewed/re-synced the instructions

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error updating judge template {JudgeTemplateId} for project version {ProjectVersionId}",
                request.JudgeTemplateId,
                request.ProjectVersionId
            );
            return ErrorCode.DatabaseError;
        }

        return new UpdateJudgeTemplateResponse();
    }
}