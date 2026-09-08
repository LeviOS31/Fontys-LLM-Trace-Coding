using Mediator;
using Microsoft.Extensions.AI;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Settings.Contracts.Features.GetLlmConfig;
using Settings.Features.GetLlmStatus;
using Shared;
using Shared.Interfaces;
using Shouldly;

namespace Settings.Tests.Features.GetLlmStatus;

public class GetLlmStatusHandlerTests
{
    [Fact]
    public async Task WhenGetLlmConfigFails_ReturnsErrorCode()
    {
        // Arrange
        var mediator = Substitute.For<IMediator>();
        var chatClientBuilder = Substitute.For<IChatClientBuilder>();

        mediator.Send(Arg.Any<GetLlmConfigQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.LlmConfigError);

        var handler = new GetLlmStatusHandler(mediator, chatClientBuilder);
        var request = new GetLlmStatusQuery { UserId = Guid.NewGuid() };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.LlmConfigError);
    }

    [Fact]
    public async Task WhenBuildReturnsError_ReturnsConfigError()
    {
        // Arrange
        var mediator = Substitute.For<IMediator>();
        var chatClientBuilder = Substitute.For<IChatClientBuilder>();

        // mediator first — before any Arg.Any builder setups
        mediator
            .Send(Arg.Any<GetLlmConfigQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetLlmConfigResponse
                {
                    ProviderName = "invalid",
                    Endpoint = new Uri("http://localhost"),
                    ModelName = "",
                }
            );

        chatClientBuilder.WithProvider(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.WithEndpoint(Arg.Any<Uri>()).Returns(chatClientBuilder);
        chatClientBuilder.WithModel(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.Build().Returns(ErrorCode.LlmConfigError);

        var handler = new GetLlmStatusHandler(mediator, chatClientBuilder);
        var request = new GetLlmStatusQuery { UserId = Guid.NewGuid() };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.LlmConfigError);
    }

    [Fact]
    public async Task WhenConfigIsValidButPingFails_ReturnsIsConnectedFalseWithMetadata()
    {
        // Arrange
        var mediator = Substitute.For<IMediator>();
        var chatClientBuilder = Substitute.For<IChatClientBuilder>();
        var chatClient = Substitute.For<IChatClient>();

        // mediator first — before any Arg.Any builder setups
        mediator
            .Send(Arg.Any<GetLlmConfigQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetLlmConfigResponse
                {
                    ProviderName = "Ollama",
                    Endpoint = new Uri("http://localhost:9999"),
                    ModelName = "dummy",
                }
            );

        chatClientBuilder.WithProvider(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.WithEndpoint(Arg.Any<Uri>()).Returns(chatClientBuilder);
        chatClientBuilder.WithModel(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.Build().Returns(Result.Success(chatClient));

        // GetResponseAsync(string) is an extension method — mock the actual interface method instead
        chatClient
            .GetResponseAsync(Arg.Any<IList<ChatMessage>>(), Arg.Any<ChatOptions>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("simulated failure"));

        chatClient
            .GetService<ChatClientMetadata>()
            .Returns(new ChatClientMetadata("ollama", new Uri("http://localhost:9999"), "dummy"));

        var handler = new GetLlmStatusHandler(mediator, chatClientBuilder);
        var request = new GetLlmStatusQuery { UserId = Guid.NewGuid() };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.IsConnected.ShouldBeFalse();
        result.Value.ProviderName.ShouldBe("ollama");
        result.Value.Endpoint.ShouldBe(new Uri("http://localhost:9999"));
        result.Value.ModelName.ShouldBe("dummy");
    }
}
