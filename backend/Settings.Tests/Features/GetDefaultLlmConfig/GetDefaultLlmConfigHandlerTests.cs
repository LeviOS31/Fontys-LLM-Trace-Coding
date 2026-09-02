using Microsoft.Extensions.Configuration;
using NSubstitute;
using Settings.Features.GetDefaultLlmConfig;
using Shared;
using Shouldly;

namespace Settings.Tests.Features.GetDefaultLlmConfig;

public class GetDefaultLlmConfigHandlerTests
{
    [Fact]
    public async Task WhenAllConfigExists_ShouldReturnConfig()
    {
        // Arrange
        var mockConfig = Substitute.For<IConfiguration>();
        mockConfig["AI:Provider"].Returns("OpenAI");
        mockConfig["AI:openai:Model"].Returns("gpt-4");
        mockConfig["AI:openai:Endpoint"].Returns("https://api.openai.com");

        var handler = new GetDefaultLlmConfigHandler(mockConfig);
        var request = new GetDefaultLlmConfigQuery();

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ProviderName.ShouldBe("openai");
        result.Value.ModelName.ShouldBe("gpt-4");
        result.Value.Endpoint.ShouldBe(new Uri("https://api.openai.com"));
    }

    [Fact]
    public async Task WhenProviderIsMissing_ShouldReturnError()
    {
        // Arrange
        var mockConfig = Substitute.For<IConfiguration>();
        mockConfig["AI:Provider"].Returns((string?)null);

        var handler = new GetDefaultLlmConfigHandler(mockConfig);
        var request = new GetDefaultLlmConfigQuery();

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.LlmConfigError);
    }

    [Fact]
    public async Task WhenModelIsMissing_ShouldReturnError()
    {
        // Arrange
        var mockConfig = Substitute.For<IConfiguration>();
        mockConfig["AI:Provider"].Returns("OpenAI");
        mockConfig["AI:openai:Model"].Returns((string?)null);

        var handler = new GetDefaultLlmConfigHandler(mockConfig);
        var request = new GetDefaultLlmConfigQuery();

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.LlmConfigError);
    }

    [Fact]
    public async Task WhenEndpointIsMissing_ShouldReturnError()
    {
        // Arrange
        var mockConfig = Substitute.For<IConfiguration>();
        mockConfig["AI:Provider"].Returns("OpenAI");
        mockConfig["AI:openai:Model"].Returns("gpt-4");
        mockConfig["AI:openai:Endpoint"].Returns((string?)null);

        var handler = new GetDefaultLlmConfigHandler(mockConfig);
        var request = new GetDefaultLlmConfigQuery();

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.LlmConfigError);
    }
}
