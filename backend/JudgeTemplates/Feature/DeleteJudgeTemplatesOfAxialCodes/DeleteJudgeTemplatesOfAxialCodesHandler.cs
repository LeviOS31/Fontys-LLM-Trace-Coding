using System.Data.Common;
using JudgeTemplates.Contracts.Features.DeleteJudgeTemplatesOfAxialCodes;
using JudgeTemplates.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace JudgeTemplates.Feature.DeleteJudgeTemplatesOfAxialCodes;

/// <summary>
/// Removes the judge templates (and their version history) of axial codes that are being deleted,
/// so no template is left pointing to an axial code that no longer exists.
/// </summary>
public class DeleteJudgeTemplatesOfAxialCodesHandler
    : IRequestHandler<DeleteJudgeTemplatesOfAxialCodesRequest, Result<DeleteJudgeTemplatesOfAxialCodesResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<DeleteJudgeTemplatesOfAxialCodesHandler>();
    private readonly JudgeTemplatesDbContext _dbContext;

    public DeleteJudgeTemplatesOfAxialCodesHandler(JudgeTemplatesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async ValueTask<Result<DeleteJudgeTemplatesOfAxialCodesResponse>> Handle(
        DeleteJudgeTemplatesOfAxialCodesRequest request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var templates = await _dbContext
                .JudgeTemplates.Where(jt =>
                    jt.ProjectId == request.ProjectId
                    && jt.ProjectVersionId == request.ProjectVersionId
                    && request.AxialCodeIds.Contains(jt.AxialCodeId)
                )
                .ToListAsync(cancellationToken);

            if (templates.Count == 0)
            {
                return new DeleteJudgeTemplatesOfAxialCodesResponse();
            }

            // Versions have no foreign key to their template, so they are removed explicitly.
            var templateIds = templates.Select(t => t.JudgeTemplateId).ToList();
            var versions = await _dbContext
                .JudgeTemplateVersions.Where(v => templateIds.Contains(v.JudgeTemplateId))
                .ToListAsync(cancellationToken);

            _dbContext.JudgeTemplateVersions.RemoveRange(versions);
            _dbContext.JudgeTemplates.RemoveRange(templates);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error deleting judge templates of old axial codes for project version {ProjectVersionId}",
                request.ProjectVersionId
            );
            return ErrorCode.DatabaseError;
        }

        return new DeleteJudgeTemplatesOfAxialCodesResponse();
    }
}
