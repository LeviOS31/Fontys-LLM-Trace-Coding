using Api.Extensions;
using Judge.Features.JudgeTracesForAxialCode;
using Judge.Features.ListJudgeRuns;
using Judge.Features.DeleteJudgeRun;
using Judge.Features.GetJudgeRun;
using Mediator;

namespace Api.Endpoints.Judge;

public static class JudgeEndpoints
{
    public static void MapJudgeEndpoint(this WebApplication app)
    {
        app.MapPost(
                "/v1/projects/{projectId:guid}/versions/{projectVersionId:guid}/axial-codes/{axialCodeId:guid}/judge",
                async (
                    Guid projectId,
                    Guid projectVersionId,
                    Guid axialCodeId,
                    IMediator mediator
                ) =>
                {
                    var request = new JudgeTracesForAxialCodeRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProjectId = projectId,
                        ProjectVersionId = projectVersionId,
                        AxialCodeId = axialCodeId,
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags("Judge");

        app.MapGet(
        "/v1/projects/{projectId:guid}/versions/{projectVersionId:guid}/judge-runs",
        async (
            Guid projectId,
            Guid projectVersionId,
            IMediator mediator,
            int limit = 20,
            int offset = 0
        ) =>
        {
            var result = await mediator.Send(
                new ListJudgeRunsRequest
                {
                    UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                    ProjectId = projectId,
                    ProjectVersionId = projectVersionId,
                    Limit = limit,
                    Offset = offset,
                }
            );
            return result.ToHttpResult();
        }
    )
    .WithTags("Judge");

        app.MapGet(
                "/v1/projects/{projectId:guid}/versions/{projectVersionId:guid}/judge-runs/{judgeRunId:guid}",
                async (Guid projectId, Guid projectVersionId, Guid judgeRunId, IMediator mediator) =>
                {
                    var result = await mediator.Send(
                        new GetJudgeRunRequest
                        {
                            UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                            ProjectId = projectId,
                            ProjectVersionId = projectVersionId,
                            JudgeRunId = judgeRunId,
                        }
                    );
                    return result.ToHttpResult();
                }
            )
            .WithTags("Judge");

        app.MapDelete(
                "/v1/projects/{projectId:guid}/versions/{projectVersionId:guid}/judge-runs/{judgeRunId:guid}",
                async (Guid projectId, Guid projectVersionId, Guid judgeRunId, IMediator mediator) =>
                {
                    var result = await mediator.Send(
                        new DeleteJudgeRunRequest
                        {
                            UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                            ProjectId = projectId,
                            ProjectVersionId = projectVersionId,
                            JudgeRunId = judgeRunId,
                        }
                    );
                    return result.ToHttpResult();
                }
            )
            .WithTags("Judge");
    }
}