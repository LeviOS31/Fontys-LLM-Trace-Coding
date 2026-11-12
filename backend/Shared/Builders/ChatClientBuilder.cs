using System.ClientModel;
using System.ClientModel.Primitives;
using Microsoft.Extensions.AI;
using OllamaSharp;
using OpenAI;
using Shared.Interfaces;

namespace Shared.Builders;

public class ChatClientBuilder : IChatClientBuilder
{
    private string? _provider;
    private Uri? _endpoint;
    private string? _model;
    private string? _apiKey;
    private readonly IHttpClientFactory _httpClientFactory;

    public ChatClientBuilder(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public IChatClientBuilder WithProvider(string? provider)
    {
        _provider = provider;
        return this;
    }

    public IChatClientBuilder WithEndpoint(Uri? endpoint)
    {
        _endpoint = endpoint;
        return this;
    }

    public IChatClientBuilder WithModel(string? model)
    {
        _model = model;
        return this;
    }

    public IChatClientBuilder WithApiKey(string? apiKey)
    {
        _apiKey = apiKey;
        return this;
    }

    public Result<IChatClient> Build()
    {
        if (
            string.IsNullOrWhiteSpace(_provider)
            || _endpoint is not { IsAbsoluteUri: true }
            || string.IsNullOrWhiteSpace(_model)
        )
        {
            return ErrorCode.LlmConfigError;
        }

        return _provider.Trim().ToLowerInvariant() switch
        {
            "ollama" => BuildOllamaClient(),
            "openrouter" => BuildOpenAiCompatibleClient("openrouter"),
            _ => ErrorCode.LlmConfigError,
        };
    }

    private Result<IChatClient> BuildOllamaClient()
    {
        var httpClient = _httpClientFactory.CreateClient("ollama");
        httpClient.BaseAddress = _endpoint;
        return new OllamaApiClient(httpClient, _model!);
    }

    private Result<IChatClient> BuildOpenAiCompatibleClient(string clientName)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            return ErrorCode.LlmConfigError;
        }

        var options = new OpenAIClientOptions
        {
            Endpoint = _endpoint, // https://openrouter.ai/api/v1
            Transport = new HttpClientPipelineTransport(
                _httpClientFactory.CreateClient(clientName)
            ),
        };

        var openAiClient = new OpenAIClient(new ApiKeyCredential(_apiKey), options);
        return Result.Success(openAiClient.GetChatClient(_model!).AsIChatClient());
    }
}