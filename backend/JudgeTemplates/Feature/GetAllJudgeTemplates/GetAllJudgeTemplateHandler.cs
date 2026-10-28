using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Data;
using JudgeTemplates.Feature.Shared;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace JudgeTemplates.Feature.GetJudgeTemplates;

public class GetAllJudgeTemplateHandler
    : IRequestHandler<GetAllJudgeTemplateRequest, Result<GetAllJudgeTemplateResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetAllJudgeTemplateHandler>();

    private readonly JudgeTemplatesDbContext _dbContext;
    private readonly IMediator _mediator;

    public GetAllJudgeTemplateHandler(JudgeTemplatesDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<GetAllJudgeTemplateResponse>> Handle(
        GetAllJudgeTemplateRequest request,
        CancellationToken cancellationToken
    )
    {
        // Validates user access, checks version belongs to project, and returns all axial codes (active + deprecated)
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

        var axialCodeMap = axialCodesResponse.Value!.AxialCodes.ToDictionary(a => a.AxialCodeId);

        var axialCodeIds = axialCodeMap.Keys.ToList();

        var judgeTemplates = await _dbContext
            .JudgeTemplates.Where(jt => axialCodeIds.Contains(jt.AxialCodeId))
            .ToListAsync(cancellationToken);

        return new GetAllJudgeTemplateResponse
        {
            JudgeTemplates = judgeTemplates.Select(jt =>
            {
                var axialCode = axialCodeMap[jt.AxialCodeId];

                var template = jt.CustomJudgeTemplateContent
                    ?? DefaultJudgeTemplate.Render(axialCode);

                return new GetAllJudgeTemplateResponse.JudgeTemplateViewModel
                {
                    Id = jt.JudgeTemplateId,
                    AxialCodeId = jt.AxialCodeId,
                    Name = jt.JudgeTemplateName,
                    Description = jt.JudgeTemplateDescription,
                    Template = template,
                    IsDeprecated = jt.IsDeprecated,
                    CurrentVersionNumber = jt.CurrentVersionNumber,
                };
            }),
        };
    }
}
