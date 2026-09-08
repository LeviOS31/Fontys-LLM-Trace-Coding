using Mediator;
using Microsoft.Extensions.Configuration;
using Serilog;
using Shared;

namespace Settings.Features.GetDefaultLlmConfig;

public class GetDefaultLlmConfigHandler : IRequestHandler<GetDefaultLlmConfigQuery, Result<GetDefaultLlmConfigResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetDefaultLlmConfigHandler>();
    private readonly IConfiguration _configuration;

    public GetDefaultLlmConfigHandler(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public ValueTask<Result<GetDefaultLlmConfigResponse>> Handle(
        GetDefaultLlmConfigQuery request,
        CancellationToken cancellationToken
    )
    {
        var provider = _configuration["AI:Provider"]?.ToLower();
        if (provider is null)
        {
            Logger.Error("No AI provider configured");
            return ValueTask.FromResult(Result.Error<GetDefaultLlmConfigResponse>(ErrorCode.LlmConfigError));
        }

        var model = _configuration[$"AI:{provider}:Model"];
        if (model is null)
        {
            Logger.Error("No AI model configured");
            return ValueTask.FromResult(Result.Error<GetDefaultLlmConfigResponse>(ErrorCode.LlmConfigError));
        }

        var endpoint = _configuration[$"AI:{provider}:Endpoint"];
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var endpointUri))
        {
            Logger.Error("No AI endpoint configured");
            return ValueTask.FromResult(Result.Error<GetDefaultLlmConfigResponse>(ErrorCode.LlmConfigError));
        }

        return ValueTask.FromResult(
            Result.Success(
                new GetDefaultLlmConfigResponse
                {
                    ProviderName = provider,
                    Endpoint = endpointUri,
                    ModelName = model,
                }
            )
        );
    }
}
