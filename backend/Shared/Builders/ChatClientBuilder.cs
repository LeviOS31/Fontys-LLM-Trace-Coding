using Microsoft.Extensions.AI;
using OllamaSharp;
using Shared.Interfaces;

namespace Shared.Builders;

public class ChatClientBuilder : IChatClientBuilder
{
    private string? _provider;
    private Uri? _endpoint;
    private string? _model;
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
            _ => ErrorCode.LlmConfigError,
        };
    }

    private Result<IChatClient> BuildOllamaClient()
    {
        var httpClient = _httpClientFactory.CreateClient("ollama");
        httpClient.BaseAddress = _endpoint;
        return new OllamaApiClient(httpClient, _model!);
    }
}
