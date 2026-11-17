using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Contracts.Features.InternalGetJudgeTemplates;
using JudgeTemplates.Data;
using JudgeTemplates.Data.Models;
using JudgeTemplates.Feature.Shared;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Shared;

namespace JudgeTemplates.Feature.InternalGetJudgeTemplates;

public class InternalGetJudgeTemplatesHandler
    : IRequestHandler<InternalGetJudgeTemplatesRequest, Result<InternalGetJudgeTemplatesResponse>>
{
    private readonly JudgeTemplatesDbContext _dbContext;
    private readonly IMediator _mediator;

    public InternalGetJudgeTemplatesHandler(JudgeTemplatesDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<InternalGetJudgeTemplatesResponse>> Handle(
        InternalGetJudgeTemplatesRequest request,
        CancellationToken cancellationToken)
    {

        var axialCodesResponse = await _mediator.Send(
           new InternalGetAllAxialCodesByVersionRequest
           {
               ProjectId = request.ProjectId,
               ProjectVersionId = request.ProjectVersionId,
               UserId = request.UserId,
           },
           cancellationToken);

        if (axialCodesResponse.IsError)
        {
            return axialCodesResponse.ErrorCode!.Value;
        }


        var judgeTemplates = new List<JudgeTemplate>();

        if (request.judgeIds is null || request.judgeIds.Count == 0)
        {
            judgeTemplates = await _dbContext.JudgeTemplates
                .ToListAsync(cancellationToken);
        }
        else
        {
            judgeTemplates = await _dbContext.JudgeTemplates
                .Where(jt => request.judgeIds.Contains(jt.JudgeTemplateId))
                .ToListAsync(cancellationToken);
        }


        if (judgeTemplates is null || judgeTemplates.Count == 0)
        {
            return ErrorCode.EntityNotFound;
        }

        var axialCodes = axialCodesResponse.Value.AxialCodes;

        var response = new InternalGetJudgeTemplatesResponse
        {
            JudgeTemplates = judgeTemplates.Select(jt => new JudgeTemplateViewModel
            {
                JudgeTemplateId = jt.JudgeTemplateId,
                Content = jt.CustomJudgeTemplateContent != null? jt.CustomJudgeTemplateContent : DefaultJudgeTemplate.Render(axialCodes.First(a => a.AxialCodeId == jt.AxialCodeId)),
                IsDeprecated = jt.IsDeprecated
            }).ToArray()
        };
        return response;
    }
}