using System.Data.Common;
using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace JudgeTemplates.Feature.DeleteJudgeTemplateVersion;

public class DeleteJudgeTemplateVersionHandler
    : IRequestHandler<DeleteJudgeTemplateVersionRequest, Result<DeleteJudgeTemplateVersionResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<DeleteJudgeTemplateVersionHandler>();
    private readonly JudgeTemplatesDbContext _dbContext;
    private readonly IMediator _mediator;

    public DeleteJudgeTemplateVersionHandler(JudgeTemplatesDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<DeleteJudgeTemplateVersionResponse>> Handle(
        DeleteJudgeTemplateVersionRequest request,
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

        var template = await _dbContext.JudgeTemplates.FirstOrDefaultAsync(
            jt =>
                jt.JudgeTemplateId == request.JudgeTemplateId
                && jt.ProjectId == request.ProjectId
                && jt.ProjectVersionId == request.ProjectVersionId,
            cancellationToken
        );

        if (template is null)
        {
            return ErrorCode.EntityNotFound;
        }

        // The current version is the one the template is actually using. Templates
        // created before CurrentVersionNumber existed fall back to the highest version.
        int? currentVersionNumber =
            template.CurrentVersionNumber
            ?? await _dbContext
                .JudgeTemplateVersions.Where(v => v.JudgeTemplateId == request.JudgeTemplateId)
                .Select(v => (int?)v.VersionNumber)
                .MaxAsync(cancellationToken);

        if (currentVersionNumber == request.VersionNumber)
        {
            return ErrorCode.InvalidOperation; // can't delete the version currently in use
        }

        int changes;
        try
        {
            changes = await _dbContext
                .JudgeTemplateVersions.Where(v =>
                    v.JudgeTemplateId == request.JudgeTemplateId && v.VersionNumber == request.VersionNumber
                )
                .ExecuteDeleteAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error deleting version {VersionNumber} of judge template {JudgeTemplateId}",
                request.VersionNumber,
                request.JudgeTemplateId
            );
            return ErrorCode.DatabaseError;
        }

        if (changes == 0)
        {
            return ErrorCode.EntityNotFound;
        }

        return new DeleteJudgeTemplateVersionResponse();
    }
}