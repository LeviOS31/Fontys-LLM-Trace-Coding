using System.Reflection;
using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using JudgeTemplates.Data;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared;

namespace JudgeTemplates.Feature.GetJudgeTemplates;

public class GetAllJudgeTemplateHandler
    : IRequestHandler<GetAllJudgeTemplateRequest, Result<GetAllJudgeTemplateResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetAllJudgeTemplateHandler>();
    private static readonly Lazy<string> _judgeTemplateText = new(() =>
        LoadTemplate("JudgeTemplates.Resources.JudgeTemplate.EmptyJudgeTemplate.txt")
    );

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

                var template = _judgeTemplateText
                    .Value.Replace("{{axial_code_name}}", axialCode.Label)
                    .Replace("{{axial_code_description}}", axialCode.Description);

                return new GetAllJudgeTemplateResponse.JudgeTemplateViewModel
                {
                    Id = jt.JudgeTemplateId,
                    Name = jt.JudgeTemplateName,
                    Description = jt.JudgeTemplateDescription,
                    Template = template,
                    IsDeprecated = jt.IsDeprecated,
                };
            }),
        };
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
