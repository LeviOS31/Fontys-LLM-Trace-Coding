using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Data;
using JudgeTemplates.Feature.Shared;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Shared;

namespace JudgeTemplates.Contracts.Features.InternalGetJudgeTemplateByAxialCodeId;

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

        var axialCode = axialCodesResponse.Value!.AxialCodes
            .FirstOrDefault(a => a.AxialCodeId == request.AxialCodeId);

        if (axialCode is null)
        {
            return ErrorCode.EntityNotFound;
        }

        var judgeTemplate = await _dbContext.JudgeTemplates
            .FirstOrDefaultAsync(jt => jt.AxialCodeId == request.AxialCodeId, cancellationToken);

        if (judgeTemplate is null)
        {
            return ErrorCode.EntityNotFound;
        }

        var content = judgeTemplate.CustomJudgeTemplateContent
            ?? DefaultJudgeTemplate.Render(axialCode);

        return new InternalGetJudgeTemplateByAxialCodeIdResponse
        {
            JudgeTemplateId = judgeTemplate.JudgeTemplateId,
            Content = content,
            IsDeprecated = judgeTemplate.IsDeprecated,
        };
    }
}