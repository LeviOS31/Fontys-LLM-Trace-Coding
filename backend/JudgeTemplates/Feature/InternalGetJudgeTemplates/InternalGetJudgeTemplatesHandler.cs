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

        var judgeTemplates = await _dbContext.JudgeTemplates
            .Where(jt => request.judgeIds.Contains(jt.JudgeTemplateId))
            .ToListAsync(cancellationToken);

        if (judgeTemplates is null || judgeTemplates.Count == 0)
        {
            return ErrorCode.EntityNotFound;
        }

        var response = new InternalGetJudgeTemplatesResponse
        {
            JudgeTemplates = judgeTemplates.Select(jt => new JudgeTemplateViewModel
            {
                JudgeTemplateId = jt.JudgeTemplateId,
                Content = jt.CustomJudgeTemplateContent,
                IsDeprecated = jt.IsDeprecated
            }).ToArray()
        };
        return response;
    }
}