using Api.Endpoints.JudgeTemplates.Dtos;
using Api.Extensions;
using JudgeTemplates.Feature.CreateJudgeTemplate;
using JudgeTemplates.Feature.DeleteJudgeTemplate;
using JudgeTemplates.Feature.GetJudgeTemplates;
using Mediator;

namespace Api.Endpoints.JudgeTemplates;

public static class JudgeTemplatesEndpoints
{
    public static void MapJudgeTemplatesEndpoint(this WebApplication app)
    {
        app.MapPost(
                "/v1/projects/{projectId:guid}/versions/{projectVersionId:guid}/axial-codes/{axialCodeId:guid}/judge-template",
                async (
                    Guid projectId,
                    Guid projectVersionId,
                    Guid axialCodeId,
                    CreateJudgeTemplateDto body,
                    IMediator mediator
                ) =>
                {
                    var request = new CreateJudgeTemplateRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProjectId = projectId,
                        ProjectVersionId = projectVersionId,
                        AxialCodeId = axialCodeId,
                        Name = body.Name,
                        Description = body.Description,
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags("JudgeTemplates");

        app.MapGet(
                "/v1/projects/{projectId:guid}/versions/{projectVersionId:guid}/judge-templates",
                async (Guid projectId, Guid projectVersionId, IMediator mediator) =>
                {
                    var request = new GetAllJudgeTemplateRequest()
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProjectId = projectId,
                        ProjectVersionId = projectVersionId,
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags("JudgeTemplates");

        app.MapDelete(
                "/v1/projects/{projectId:guid}/versions/{projectVersionId:guid}/judge-templates/{judgeTemplateId:guid}",
                async (Guid projectId, Guid projectVersionId, Guid judgeTemplateId, IMediator mediator) =>
                {
                    var request = new DeleteJudgeTemplateRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProjectId = projectId,
                        ProjectVersionId = projectVersionId,
                        JudgeTemplateId = judgeTemplateId,
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags("JudgeTemplates");
    }
}
