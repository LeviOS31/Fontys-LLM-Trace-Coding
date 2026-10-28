using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Contracts.Features.InternalGetJudgeTemplateByAxialCodeId;
using JudgeTemplates.Data;
using JudgeTemplates.Data.Models;
using JudgeTemplates.Feature.Shared;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Shared;
using static AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion.InternalGetAllAxialCodesByVersionResponse;

namespace JudgeTemplates.Feature.InternalGetJudgeTemplateByAxialCodeId;

public class InternalGetJudgeTemplateByAxialCodeIdHandler
    : IRequestHandler<InternalGetJudgeTemplateByAxialCodeIdRequest, Result<InternalGetJudgeTemplateByAxialCodeIdResponse>>
{
    private readonly JudgeTemplatesDbContext _dbContext;
    private readonly IMediator _mediator;

    public InternalGetJudgeTemplateByAxialCodeIdHandler(JudgeTemplatesDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<InternalGetJudgeTemplateByAxialCodeIdResponse>> Handle(
        InternalGetJudgeTemplateByAxialCodeIdRequest request,
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

        var axialCodes = axialCodesResponse.Value.AxialCodes.Where(a => request.AxialCodeIds.Contains(a.AxialCodeId)).ToArray();

        if (axialCodes is null || axialCodes.Length == 0)
        {
            return ErrorCode.EntityNotFound;
        }

        var judgeTemplates = await _dbContext.JudgeTemplates
            .Where(jt => request.AxialCodeIds.Contains(jt.AxialCodeId))
            .ToListAsync(cancellationToken);

        if (judgeTemplates is null || judgeTemplates.Count == 0)
        {
            return ErrorCode.EntityNotFound;
        }

        var response = new InternalGetJudgeTemplateByAxialCodeIdResponse
        {
            JudgeTemplates = judgeTemplates.Select(jt => new JudgeTemplateViewModel
            {
                JudgeTemplateId = jt.JudgeTemplateId,
                Content = jt.CustomJudgeTemplateContent ?? DefaultJudgeTemplate.Render(axialCodes.First(a => a.AxialCodeId == jt.AxialCodeId)),
                IsDeprecated = jt.IsDeprecated
            }).ToArray()
        };
        return response;
    }
}