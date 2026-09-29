using Api.Endpoints.ProjectVersions.Dtos;
using Api.Extensions;
using Mediator;
using ProjectVersions.Features.CreateProjectVersion;
using ProjectVersions.Features.DeleteProjectVersion;
using ProjectVersions.Features.EditProjectVersion;

namespace Api.Endpoints.ProjectVersions;

public static class ProjectVersionsEndpoints
{
    public static void MapProjectVersionsEndpoints(this WebApplication app)
    {
        app.MapPost(
                "/v1/projects/{projectId:guid}/versions",
                async (Guid projectId, CreateProjectVersionDto dto, IMediator mediator) =>
                {
                    var request = new CreateProjectVersionRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProjectId = projectId,
                        Name = dto.Name,
                        Description = dto.Description,
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags("Versions");

        app.MapPut(
                "/v1/projects/{projectId:guid}/versions/{versionId:guid}",
                async (Guid projectId, Guid versionId, EditProjectVersionDto dto, IMediator mediator) =>
                {
                    var request = new EditProjectVersionRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProjectId = projectId,
                        VersionId = versionId,
                        Name = dto.Name,
                        Description = dto.Description,
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags("Versions");

        app.MapDelete(
                "/v1/projects/{projectId:guid}/versions/{versionId:guid}",
                async (Guid projectId, Guid versionId, IMediator mediator) =>
                {
                    var request = new DeleteProjectVersionRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProjectId = projectId,
                        VersionId = versionId,
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags("Versions");
    }
}
