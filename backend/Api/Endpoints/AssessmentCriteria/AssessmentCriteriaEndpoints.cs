using Api.Endpoints.AssessmentCriteria.Dtos;
using Api.Extensions;
using AssessmentCriteria.Features.CreateAssessmentCriterion;
using AssessmentCriteria.Features.DeleteAssessmentCriterion;
using AssessmentCriteria.Features.UpdateAssessmentCriterion;
using Mediator;

namespace Api.Endpoints.AssessmentCriteria;

public static class AssessmentCriteriaEndpoints
{
    public static void MapAssessmentCriteriaEndpoints(this WebApplication app)
    {
        app.MapPost(
                "/v1/projects/{projectId:guid}/assessment-criteria",
                async (Guid projectId, CreateAssessmentCriterionDto dto, IMediator mediator) =>
                {
                    var request = new CreateAssessmentCriterionRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProjectId = projectId,
                        Criterion = dto.Criterion,
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags("AssessmentCriteria");

        app.MapPut(
                "/v1/projects/{projectId:guid}/assessment-criteria/{criterionId:guid}",
                async (Guid projectId, Guid criterionId, UpdateAssessmentCriterionDto dto, IMediator mediator) =>
                {
                    var request = new UpdateAssessmentCriterionRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProjectId = projectId,
                        CriterionId = criterionId,
                        Criterion = dto.Criterion,
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
                    var request = new DeleteAssessmentCriterionRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProjectId = projectId,
                        CriterionId = criterionId,
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags("AssessmentCriteria");
    }
}
