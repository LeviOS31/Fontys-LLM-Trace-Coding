using Api.Endpoints.AxialCode.Dtos;
using Api.Extensions;
using AxialCodes.Contracts.Features.GetAxialCodes;
using AxialCodes.Contracts.Features.InternalGetAxialCodeById;
using AxialCodes.Features.GenerateAxialCodingResult;
using AxialCodes.Features.SaveAxialCodes;
using Mediator;
using AxialCodeViewModel = AxialCodes.Features.GenerateAxialCodingResult.AxialCodeViewModel;

namespace Api.Endpoints.AxialCode;

public static class AxialCodeEndpoints
{
    public static void MapAxialCodeEndpoint(this WebApplication app)
    {
        app.MapPost(
                "/v1/projects/{projectId:guid}/versions/{projectVersionId:guid}/axial-coding-results/generate",
                async (Guid projectId, Guid projectVersionId, GenerateAxialCodesDto dto, IMediator mediator) =>
                {
                    var request = new GenerateAxialCodingResultRequest
                    {
                        ProjectId = projectId,
                        ProjectVersionId = projectVersionId,
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                        Feedback = dto.Feedback,
                        AxialCodes = (dto.AxialCodes ?? []).Select(ax => new AxialCodeViewModel
                        {
                            Label = ax.Label,
                            Description = ax.Description,
                            TraceIds = ax.TraceIds,
                        }),
                    };

                    var result = await mediator.Send(request);
                    return result.ToHttpResult();
                }
            )
            .WithTags("AxialCodes");

        app.MapGet(
                "/v1/projects/{projectId:guid}/versions/{projectVersionId:guid}/axial-coding-results/current",
                async (Guid projectId, Guid projectVersionId, IMediator mediator) =>
                {
                    var request = new GetAxialCodesQuery
                    {
                        ProjectId = projectId,
                        ProjectVersionId = projectVersionId,
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                    };

                    var result = await mediator.Send(request);
                    return result.ToHttpResult();
                }
            )
            .WithTags("AxialCodes");

        app.MapGet(
                "/v1/projects/{projectId:guid}/versions/{projectVersionId:guid}/axial-coding-results/current/{axialCodeId:guid}",
                async (Guid projectId, Guid projectVersionId, Guid axialCodeId, IMediator mediator) =>
                {
                    var request = new InternalGetAxialCodeByIdRequest
                    {
                        ProjectId = projectId,
                        ProjectVersionId = projectVersionId,
                        AxialCodeId = axialCodeId,
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                    };

                    var result = await mediator.Send(request);
                    return result.ToHttpResult();
                }
            )
            .WithTags("AxialCodes");

        app.MapPost(
                "/v1/projects/{projectId:guid}/versions/{projectVersionId:guid}/axial-coding-results/{axialCodingResultId:guid}/save",
                async (Guid projectId, Guid projectVersionId, Guid axialCodingResultId, IMediator mediator) =>
                {
                    var request = new SaveAxialCodesRequest
                    {
                        ProjectId = projectId,
                        ProjectVersionId = projectVersionId,
                        AxialCodingResultId = axialCodingResultId,
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                    };

                    var result = await mediator.Send(request);
                    return result.ToHttpResult();
                }
            )
            .WithTags("AxialCodes");
    }
}
