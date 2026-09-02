using Mediator;
using Microsoft.Extensions.AI;
using Serilog;
using Settings.Contracts.Features.GetLlmConfig;
using Shared;
using Shared.Interfaces;

namespace Settings.Features.GetLlmStatus;

public class GetLlmStatusHandler : IRequestHandler<GetLlmStatusQuery, Result<GetLlmStatusResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GetLlmStatusHandler>();
    private readonly IMediator _mediator;
    private readonly IChatClientBuilder _chatClientBuilder;

    public GetLlmStatusHandler(IMediator mediator, IChatClientBuilder chatClientBuilder)
    {
        _mediator = mediator;
        _chatClientBuilder = chatClientBuilder;
    }

    public async ValueTask<Result<GetLlmStatusResponse>> Handle(
        GetLlmStatusQuery query,
        CancellationToken cancellationToken
    )
    {
        var chatClientResult = await GetChatClientAsync(query.UserId, cancellationToken);
        if (chatClientResult.IsError)
        {
            Logger.Error("Error getting AI chat client: {Error}", chatClientResult.ErrorCode);
            return chatClientResult.ErrorCode;
        }

        bool isConnected;
        try
        {
            var aiResponse = await chatClientResult.Value.GetResponseAsync(
                "ping",
                cancellationToken: cancellationToken
            );
            Logger.Information("Received response from AI chat client: {Response}", aiResponse);
            isConnected = true;
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "Error pinging AI chat client");
            isConnected = false;
        }

        var metadata = chatClientResult.Value.GetService<ChatClientMetadata>();
        if (metadata == null)
        {
            return new GetLlmStatusResponse
            {
                ProviderName = null,
                Endpoint = null,
                ModelName = null,
                IsConnected = isConnected,
            };
        }

        return new GetLlmStatusResponse
        {
            ProviderName = metadata.ProviderName,
            Endpoint = metadata.ProviderUri,
            ModelName = metadata.DefaultModelId,
            IsConnected = isConnected,
        };
    }

    private async Task<Result<IChatClient>> GetChatClientAsync(Guid userId, CancellationToken cancellationToken)
    {
        var llmConfigResult = await _mediator.Send(new GetLlmConfigQuery { UserId = userId }, cancellationToken);
        if (llmConfigResult.IsError)
        {
            return llmConfigResult.ErrorCode;
        }

        return _chatClientBuilder
            .WithProvider(llmConfigResult.Value.ProviderName)
            .WithEndpoint(llmConfigResult.Value.Endpoint)
            .WithModel(llmConfigResult.Value.ModelName)
            .Build();
    }
}
