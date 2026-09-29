using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Shared;

namespace JudgeTemplates.Feature.GetJudgeTemplateVersions;

public class GetJudgeTemplateVersionsHandler
    : IRequestHandler<GetJudgeTemplateVersionsRequest, Result<GetJudgeTemplateVersionsResponse>>
{
    private readonly JudgeTemplatesDbContext _dbContext;
    private readonly IMediator _mediator;

    public GetJudgeTemplateVersionsHandler(JudgeTemplatesDbContext dbContext, IMediator mediator)
    {
        _dbContext = dbContext;
        _mediator = mediator;
    }

    public async ValueTask<Result<GetJudgeTemplateVersionsResponse>> Handle(
        GetJudgeTemplateVersionsRequest request,
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

        var versions = await _dbContext
            .JudgeTemplateVersions.Where(v => v.JudgeTemplateId == request.JudgeTemplateId)
            .OrderByDescending(v => v.VersionNumber)
            .ToListAsync(cancellationToken);

        return new GetJudgeTemplateVersionsResponse
        {
            Versions = versions.Select(v => new GetJudgeTemplateVersionsResponse.JudgeTemplateVersionViewModel
            {
                VersionNumber = v.VersionNumber,
                Content = v.Content,
                CreatedAt = v.CreatedAt,
            }),
        };
    }
}