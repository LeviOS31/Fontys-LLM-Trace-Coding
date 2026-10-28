using Api.Endpoints.Judge.Dtos;
using Api.Extensions;
using Judge.Features.JudgeTracesForAxialCode;
using Mediator;

namespace Api.Endpoints.Judge;

public static class JudgeEndpoints
{
    public static void MapJudgeEndpoint(this WebApplication app)
    {
        app.MapPost(
                "/v1/projects/{projectId:guid}/versions/{projectVersionId:guid}/judge",
                async (
                    Guid projectId,
                    Guid projectVersionId,
                    JudgeBodyDto body,
                    IMediator mediator
                ) =>
                {
                    var request = new JudgeTracesForAxialCodeRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProjectId = projectId,
                        ProjectVersionId = projectVersionId,
                        AxialCodeIds = body.AxialCodeIds,
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags("Judge");
    }
}