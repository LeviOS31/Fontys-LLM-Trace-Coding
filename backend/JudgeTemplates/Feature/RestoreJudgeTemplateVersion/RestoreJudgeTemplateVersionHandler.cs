using System.Data.Common;
using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace JudgeTemplates.Feature.RestoreJudgeTemplateVersion;

public class RestoreJudgeTemplateVersionHandler
    : IRequestHandler<RestoreJudgeTemplateVersionRequest, Result<RestoreJudgeTemplateVersionResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<RestoreJudgeTemplateVersionHandler>();
    private readonly JudgeTemplatesDbContext _dbContext;
    private readonly IMediator _mediator;

    public RestoreJudgeTemplateVersionHandler(JudgeTemplatesDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<RestoreJudgeTemplateVersionResponse>> Handle(
        RestoreJudgeTemplateVersionRequest request,
        CancellationToken cancellationToken
    )
    {
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

        var judgeTemplate = await _dbContext.JudgeTemplates.FirstOrDefaultAsync(
            jt =>
                jt.JudgeTemplateId == request.JudgeTemplateId
                && jt.ProjectId == request.ProjectId
                && jt.ProjectVersionId == request.ProjectVersionId,
            cancellationToken
        );

        if (judgeTemplate is null)
        {
            return ErrorCode.EntityNotFound;
        }

        var version = await _dbContext.JudgeTemplateVersions.FirstOrDefaultAsync(
            v => v.JudgeTemplateId == request.JudgeTemplateId && v.VersionNumber == request.VersionNumber,
            cancellationToken
        );

        if (version is null)
        {
            return ErrorCode.EntityNotFound;
        }

        try
        {
            judgeTemplate.CustomJudgeTemplateContent = version.Content;
            judgeTemplate.CurrentVersionNumber = version.VersionNumber;
            judgeTemplate.IsDeprecated = false;

            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error restoring judge template {JudgeTemplateId} to version {VersionNumber}",
                request.JudgeTemplateId,
                request.VersionNumber
            );
            return ErrorCode.DatabaseError;
        }

        return new RestoreJudgeTemplateVersionResponse();
    }
}