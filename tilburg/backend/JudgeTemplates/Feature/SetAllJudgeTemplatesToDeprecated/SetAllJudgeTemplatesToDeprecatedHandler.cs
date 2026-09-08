using System.Data.Common;
using JudgeTemplates.Contracts.Features.SetAllJudgeTemplatesToDeprecated;
using JudgeTemplates.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace JudgeTemplates.Feature.SetAllJudgeTemplatesToDeprecated;

public class SetAllJudgeTemplatesToDeprecatedHandler
    : IRequestHandler<SetAllJudgeTemplatesToDeprecatedRequest, Result<SetAllJudgeTemplatesToDeprecatedResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<SetAllJudgeTemplatesToDeprecatedHandler>();
    private readonly JudgeTemplatesDbContext _dbContext;

    public SetAllJudgeTemplatesToDeprecatedHandler(JudgeTemplatesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async ValueTask<Result<SetAllJudgeTemplatesToDeprecatedResponse>> Handle(
        SetAllJudgeTemplatesToDeprecatedRequest request,
        CancellationToken cancellationToken
    )
    {
        var templates = await _dbContext
            .JudgeTemplates.Where(jt =>
                jt.ProjectId == request.ProjectId && jt.ProjectVersionId == request.ProjectVersionId
            )
            .ToListAsync(cancellationToken);

        foreach (var template in templates)
        {
            template.IsDeprecated = true;
        }

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error setting all judge templates to deprecated for project version {ProjectVersionId}",
                request.ProjectVersionId
            );
            return ErrorCode.DatabaseError;
        }

        return new SetAllJudgeTemplatesToDeprecatedResponse();
    }
}
