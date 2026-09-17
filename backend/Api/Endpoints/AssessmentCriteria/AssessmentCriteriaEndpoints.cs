using Api.Endpoints.AssessmentCriteria.Dtos;
using Api.Extensions;
using Projects.Features.CreateAssessmentCriteria;
using Projects.Features.DeleteAssessmentCriteria;
using Mediator;

namespace Api.Endpoints.AssessmentCriteria;

public static class AssessmentCriteriaEndpoints
{
    public static void MapAssessmentCriteriaEndpoints(this WebApplication app)
    {
        app.MapPost(
                "/v1/projects/{projectId:guid}/assessment-criteria",
                async (Guid projectId, CreateAssessmentCriteriaDto dto, IMediator mediator) =>
                {
                    var request = new CreateAssessmentCriteriaRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProjectId = projectId,
                        Criteria = dto.Criteria,
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags("AssessmentCriteria");

        app.MapDelete(
                "/v1/projects/{projectId:guid}/assessment-criteria/{criterionId:guid}",
                async (Guid projectId, Guid criterionId, IMediator mediator) =>
                {
                    var request = new DeleteAssessmentCriteriaRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProjectId = projectId,
                        CriteriaId = criterionId,
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags("AssessmentCriteria");
    }
}
