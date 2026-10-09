using Api.Endpoints.RawLLMOutput.Dtos;
using Api.Extensions;
using Mediator;
using RawLLMOutputs.Features.ImportRawLLMOutput;

namespace Api.Endpoints.RawLLMOutput
{
    public static class RawLLMDataEndPoints
    {
        public static void MapRawLLMDataEndpoints(this WebApplication app)
        {
            app.MapPost(
                    "/v1/projects/{projectId:guid}/version/{projectversionid:guid}/raw-llm-data",
                    async (Guid projectId, Guid projectversionid, ImportRawLLMOutputDto dto, IMediator mediator) =>
                    {
                        var request = new ImportRawLLMOutputRequest
                        {
                            UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                            ProjectVersionId = projectversionid,
                            ProjectId = projectId,
                            Name = dto.Name,
                            File = dto.File,
                        };
                        var result = await mediator.Send(request);
                        return result.ToHttpResult();
                    }
                )
                .WithTags("RawLLMData");
        }
    }
}
