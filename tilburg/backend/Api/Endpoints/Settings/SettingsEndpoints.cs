using Api.Endpoints.Settings.Dtos;
using Api.Extensions;
using Mediator;
using Settings.Features.GetDefaultLlmConfig;
using Settings.Features.GetLlmStatus;
using Settings.Features.SetLlmConfig;

namespace Api.Endpoints.Settings;

public static class SettingsEndpoints
{
    public static void MapSettingsEndpoints(this WebApplication app)
    {
        app.MapGet(
                "/v1/settings/llm/status",
                async (IMediator mediator) =>
                {
                    var request = new GetLlmStatusQuery
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                    };
                    var result = await mediator.Send(request);
                    return result.ToHttpResult();
                }
            )
            .WithTags("Settings");

        app.MapGet(
                "/v1/settings/llm/default-config",
                async (IMediator mediator) =>
                {
                    var request = new GetDefaultLlmConfigQuery();
                    var result = await mediator.Send(request);
                    return result.ToHttpResult();
                }
            )
            .WithTags("Settings");

        app.MapPut(
                "/v1/settings/llm/config",
                async (IMediator mediator, SetLlmConfigDto dto) =>
                {
                    var request = new SetLlmConfigRequest
                    {
                        UserId = new Guid("EC1145A3-869D-4B06-B4AE-7308D85839B7"), // TODO: Get user id from token
                        ProviderName = dto.ProviderName,
                        Endpoint = dto.Endpoint,
                        ModelName = dto.ModelName,
                    };

                    var result = await mediator.Send(request);
                    return result.ToHttpResult();
                }
            )
            .WithTags("Settings");
    }
}
