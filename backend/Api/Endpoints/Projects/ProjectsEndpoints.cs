using Api.Endpoints.Projects.Dtos;
using Api.Extensions;
using Mediator;
using Projects.Features.CreateProject;
using Projects.Features.DeleteProject;
using Projects.Features.EditProject;
using Projects.Features.GetAllProjects;
using GetProjectQuery = Projects.Contracts.Features.GetProject.GetProjectQuery;

namespace Api.Endpoints.Projects;

public static class ProjectsEndpoints
{
    public static void MapProjectsEndpoints(this WebApplication app)
    {
        const string projectsTag = "Projects";
        app.MapGet(
                "/v1/projects",
                async (IMediator mediator) =>
                {
                    var request = new GetAllProjectsQuery
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags(projectsTag);

        app.MapPost(
                "/v1/projects",
                async (CreateProjectDto dto, IMediator mediator) =>
                {
                    var request = new CreateProjectRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        Name = dto.Name,
                        Description = dto.Description,
                    };
                    var result = await mediator.Send(request);
                    return result.ToHttpResult();
                }
            )
            .WithTags(projectsTag);

        app.MapGet(
                "/v1/projects/{projectId:guid}",
                async (Guid projectId, IMediator mediator) =>
                {
                    var request = new GetProjectQuery
                    {
                        ProjectId = projectId,
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags(projectsTag);

        app.MapPut(
                "/v1/projects/{projectId:guid}",
                async (Guid projectId, EditProjectDto dto, IMediator mediator) =>
                {
                    var request = new EditProjectRequest
                    {
                        ProjectId = projectId,
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        Name = dto.Name,
                        Description = dto.Description,
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags(projectsTag);

        app.MapDelete(
                "/v1/projects/{projectId:guid}",
                async (Guid projectId, IMediator mediator) =>
                {
                    var request = new DeleteProjectRequest()
                    {
                        ProjectId = projectId,
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                    };
                    var result = await mediator.Send(request);

                    return result.ToHttpResult();
                }
            )
            .WithTags(projectsTag);
    }
}
