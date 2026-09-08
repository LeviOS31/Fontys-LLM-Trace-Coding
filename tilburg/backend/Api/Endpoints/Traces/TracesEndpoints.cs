using Api.Endpoints.Traces.Dtos;
using Api.Endpoints.Traces.HelperFunctions;
using Api.Extensions;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using Traces.Contracts.Features.GetTrace;
using Traces.Contracts.Features.GetVersionOpencode;
using Traces.Dtos;
using Traces.Features.DeleteTraceCollection;
using Traces.Features.EditOpenCode;
using Traces.Features.EditTraceCollection;
using Traces.Features.GetTraceCollections;
using Traces.Features.GetTraceGroup;
using Traces.Features.GetTraceSummaries;
using Traces.Features.ImportTraces;

namespace Api.Endpoints.Traces;

public static class TracesEndpoints
{
    public static void MapTracesEndpoint(this WebApplication app)
    {
        app.MapGet(
                "/v1/projects/{projectId:guid}/versions/{versionId:guid}/traces",
                async Task<IResult> (
                    Guid projectId,
                    Guid versionId,
                    int page,
                    int pageSize,
                    [FromQuery] string? filters,
                    IMediator mediator
                ) =>
                {
                    var request = new GetTraceGroupSummaryQuery
                    {
                        ProjectId = projectId,
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                        ProjectVersionId = versionId,
                        Page = page,
                        PageSize = pageSize,
                        Filters = filters
                            ?.Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                            .Select(Parsers.ParseFilter)
                            .Where(f => f != null)
                            .Cast<FilterDto>()
                            .ToList(),
                    };

                    var result = await mediator.Send(request);
                    return result.ToHttpResult();
                }
            )
            .WithTags("Traces");

        app.MapPost(
                "/v1/projects/{projectId:guid}/versions/{versionId:guid}/traces",
                async ([FromForm] ImportTracesDto dto, Guid projectId, Guid versionId, IMediator mediator) =>
                {
                    var request = new ImportTracesRequest
                    {
                        ProjectId = projectId,
                        ProjectVersionId = versionId,
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                        Name = dto.Name,
                        File = dto.File,
                    };

                    var result = await mediator.Send(request);
                    return result.ToHttpResult();
                }
            )
            .Accepts<ImportTracesDto>("multipart/form-data")
            .DisableAntiforgery()
            .WithTags("Traces");

        app.MapGet(
                "/v1/projects/{projectId:guid}/versions/{versionId:guid}/traceGroup/{traceGroupId:guid}",
                async Task<IResult> (Guid projectId, Guid versionId, Guid traceGroupId, IMediator mediator) =>
                {
                    var result = await mediator.Send(
                        new GetTraceGroupQuery
                        {
                            ProjectId = projectId,
                            UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                            TraceGroupId = traceGroupId,
                            ProjectVersionId = versionId,
                        }
                    );

                    return result.ToHttpResult();
                }
            )
            .WithTags("Traces");

        app.MapGet(
                "/v1/projects/{projectId:guid}/versions/{versionId:guid}/traces/collections",
                async Task<IResult> (Guid projectId, Guid versionId, IMediator mediator) =>
                {
                    var result = await mediator.Send(
                        new GetTraceCollectionsQuery
                        {
                            ProjectId = projectId,
                            UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                            VersionId = versionId,
                        }
                    );

                    return result.ToHttpResult();
                }
            )
            .WithTags("Traces");

        app.MapDelete(
                "/v1/projects/{projectId:guid}/versions/{versionId:guid}/traces/collections/{collectionId:guid}",
                async Task<IResult> (Guid projectId, Guid versionId, Guid collectionId, IMediator mediator) =>
                {
                    var result = await mediator.Send(
                        new DeleteTraceCollectionRequest()
                        {
                            ProjectId = projectId,
                            UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                            TraceCollectionId = collectionId,
                        }
                    );

                    return result.ToHttpResult();
                }
            )
            .WithTags("Traces");

        app.MapGet(
                "/v1/projects/{projectId:guid}/versions/{versionId:guid}/opencodes",
                async Task<IResult> (Guid projectId, Guid versionId, IMediator mediator) =>
                {
                    var result = await mediator.Send(
                        new GetVersionOpencodeQuery
                        {
                            ProjectId = projectId,
                            ProjectVersionId = versionId,
                            UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                        }
                    );
                    return result.ToHttpResult();
                }
            )
            .WithTags("Traces");

        app.MapPost(
                "/v1/projects/{projectId:guid}/versions/{versionId:guid}/traces/{traceId:guid}",
                async Task<IResult> (
                    [FromBody] TraceDto dto,
                    Guid projectId,
                    Guid versionId,
                    Guid traceId,
                    IMediator mediator
                ) =>
                {
                    var result = await mediator.Send(
                        new EditOpencodeRequest()
                        {
                            ProjectId = projectId,
                            UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                            TraceId = traceId,
                            ProjectVersionId = versionId,
                            OpenCode = dto.OpenCode,
                        }
                    );

                    return result.ToHttpResult();
                }
            )
            .WithTags("Traces");

        app.MapPatch(
                "/v1/projects/{projectId:guid}/versions/{versionId:guid}/traces/collections/{collectionId:guid}",
                async Task<IResult> (
                    Guid projectId,
                    Guid versionId,
                    Guid collectionId,
                    [FromBody] EditTraceCollectionDto dto,
                    IMediator mediator
                ) =>
                {
                    var request = new EditTraceCollectionRequest
                    {
                        ProjectId = projectId,
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get from claims
                        TraceCollectionId = collectionId,
                        Name = dto.Name,
                    };

                    var result = await mediator.Send(request);
                    return result.ToHttpResult();
                }
            )
            .WithTags("Traces");
    }
}
