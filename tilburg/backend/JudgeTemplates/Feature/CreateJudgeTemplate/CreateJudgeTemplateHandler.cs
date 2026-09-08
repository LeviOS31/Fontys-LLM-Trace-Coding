using System.Data.Common;
using AxialCodes.Contracts.Features.InternalGetAxialCodeById;
using JudgeTemplates.Data;
using JudgeTemplates.Data.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace JudgeTemplates.Feature.CreateJudgeTemplate;

public class CreateJudgeTemplateHandler
    : IRequestHandler<CreateJudgeTemplateRequest, Result<CreateJudgeTemplateResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<CreateJudgeTemplateHandler>();
    private readonly JudgeTemplatesDbContext _dbContext;
    private readonly IMediator _mediator;

    public CreateJudgeTemplateHandler(JudgeTemplatesDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<CreateJudgeTemplateResponse>> Handle(
        CreateJudgeTemplateRequest request,
        CancellationToken cancellationToken
    )
    {
        // Validates if User has acces to project, if the projectverions belongs to project and if the axialcode is active
        var axialCodeRespone = await _mediator.Send(
            new InternalGetAxialCodeByIdRequest
            {
                ProjectId = request.ProjectId,
                ProjectVersionId = request.ProjectVersionId,
                AxialCodeId = request.AxialCodeId,
                UserId = request.UserId,
            },
            cancellationToken
        );

        if (axialCodeRespone.IsError)
        {
            return axialCodeRespone.ErrorCode!.Value;
        }

        var judgeTemplate = new JudgeTemplate
        {
            JudgeTemplateId = Guid.NewGuid(),
            JudgeTemplateName = request.Name,
            JudgeTemplateDescription = request.Description ?? string.Empty,
            AxialCodeId = request.AxialCodeId,
            ProjectId = request.ProjectId,
            ProjectVersionId = request.ProjectVersionId,
            IsDeprecated = false,
        };

        int changes;
        try
        {
            _dbContext.JudgeTemplates.Add(judgeTemplate);
            changes = await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(ex, "Error creating judge template for axial code {AxialCodeId}", request.AxialCodeId);
            return ErrorCode.DatabaseError;
        }

        if (changes == 0)
        {
            return ErrorCode.NoChanges;
        }

        return new CreateJudgeTemplateResponse { JudgeTemplateId = judgeTemplate.JudgeTemplateId };
    }
}
