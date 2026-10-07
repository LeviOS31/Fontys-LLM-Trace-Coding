using System.Data.Common;
using System.Reflection;
using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Data;
using JudgeTemplates.Data.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace JudgeTemplates.Feature.UpdateJudgeTemplate;

public class UpdateJudgeTemplateHandler
    : IRequestHandler<UpdateJudgeTemplateRequest, Result<UpdateJudgeTemplateResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<UpdateJudgeTemplateHandler>();
    private static readonly Lazy<string> _judgeTemplateText = new(() =>
        LoadTemplate("JudgeTemplates.Resources.JudgeTemplate.EmptyJudgeTemplate.txt")
    );

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

        JudgeTemplate? judgeTemplate;
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
            Logger.Error(ex, "Error fetching judge template {JudgeTemplateId}", request.JudgeTemplateId);
            return ErrorCode.DatabaseError;
        }

        if (judgeTemplate is null)
        {
            return ErrorCode.EntityNotFound;
        }

            try
            {
            int? lastVersionNumber = await _dbContext
                .JudgeTemplateVersions.Where(v => v.JudgeTemplateId == judgeTemplate.JudgeTemplateId)
                .Select(v => (int?)v.VersionNumber)
                .MaxAsync(cancellationToken);

            if (lastVersionNumber is null)
            {
                // First-ever edit for this template — snapshot the content as it stood
                // before this change as v1, so history starts complete.
                var axialCode = axialCodesResponse.Value!.AxialCodes.First(a =>
                    a.AxialCodeId == judgeTemplate.AxialCodeId
                );
                var previousContent =
                    judgeTemplate.CustomJudgeTemplateContent
                    ?? _judgeTemplateText
                        .Value.Replace("{{axial_code_name}}", axialCode.Label)
                        .Replace("{{axial_code_description}}", axialCode.Description);

                _dbContext.JudgeTemplateVersions.Add(
                    new JudgeTemplateVersion
                    {
                        JudgeTemplateVersionId = Guid.NewGuid(),
                        JudgeTemplateId = judgeTemplate.JudgeTemplateId,
                        VersionNumber = 1,
                        Content = previousContent,
                        CreatedAt = DateTimeOffset.UtcNow,
                    }
                );

                lastVersionNumber = 1;
            }

            _dbContext.JudgeTemplateVersions.Add(
                new JudgeTemplateVersion
                {
                    JudgeTemplateVersionId = Guid.NewGuid(),
                    JudgeTemplateId = judgeTemplate.JudgeTemplateId,
                    VersionNumber = lastVersionNumber.Value + 1,
                    Content = request.Content,
                    CreatedAt = DateTimeOffset.UtcNow,
                }
            );

            judgeTemplate.CustomJudgeTemplateContent = request.Content;
            judgeTemplate.CurrentVersionNumber = lastVersionNumber.Value + 1;
            judgeTemplate.IsDeprecated = false;

            await _dbContext.SaveChangesAsync(cancellationToken);
    }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error updating judge template {JudgeTemplateId}", request.JudgeTemplateId);
            return ErrorCode.DatabaseError;
        }

        return new UpdateJudgeTemplateResponse();
    }

    private static string LoadTemplate(string resourceName)
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(resourceName);
        if (stream == null)
        {
            throw new InvalidOperationException($"Template resource not found: {resourceName}");
        }
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}