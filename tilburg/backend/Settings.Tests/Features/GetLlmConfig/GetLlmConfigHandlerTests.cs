using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using Settings.Contracts.Features.GetLlmConfig;
using Settings.Data;
using Settings.Data.Models;
using Settings.Features.GetLlmConfig;
using Shared;
using Shouldly;

namespace Settings.Tests.Features.GetLlmConfig;

public class GetLlmConfigHandlerTests
{
    private readonly SettingsDbContext _dbContext;

    public GetLlmConfigHandlerTests()
    {
        _dbContext = Substitute.For<SettingsDbContext>(new DbContextOptions<SettingsDbContext>());
    }

    [Fact]
    public async Task WhenConfigExists_ShouldReturnConfig()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var configs = new List<ChatClientConfiguration>
        {
            new ChatClientConfiguration
            {
                UserId = userId,
                Provider = "openai",
                Model = "gpt-4",
                Endpoint = new Uri("https://api.openai.com"),
            },
        };

        var mockDbSet = configs.BuildMockDbSet();
        _dbContext.ChatClientConfigurations.Returns(mockDbSet);

        var handler = new GetLlmConfigHandler(_dbContext);
        var request = new GetLlmConfigQuery { UserId = userId };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ProviderName.ShouldBe("openai");
        result.Value.ModelName.ShouldBe("gpt-4");
        result.Value.Endpoint.ShouldBe(new Uri("https://api.openai.com"));
    }

    [Fact]
    public async Task WhenConfigDoesNotExist_ShouldReturnEntityNotFound()
    {
        // Arrange
        var configs = new List<ChatClientConfiguration>();
        var mockDbSet = configs.BuildMockDbSet();
        _dbContext.ChatClientConfigurations.Returns(mockDbSet);

        var handler = new GetLlmConfigHandler(_dbContext);
        var request = new GetLlmConfigQuery { UserId = Guid.NewGuid() };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }
}
