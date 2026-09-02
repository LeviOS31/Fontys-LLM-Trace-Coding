using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Settings.Data;
using Settings.Data.Models;
using Settings.Features.SetLlmConfig;
using Shared;
using Shouldly;

namespace Settings.Tests.Features.SetLlmConfig;

public class SetLlmConfigHandlerTests
{
    [Fact]
    public async Task WhenConfigExists_UpdatesAndReturnsConfig()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var config = new ChatClientConfiguration
        {
            UserId = userId,
            Provider = "old-provider",
            Model = "old-model",
            Endpoint = new Uri("http://old-endpoint"),
        };

        var mockDbSet = new List<ChatClientConfiguration> { config }.BuildMockDbSet();
        var mockContext = Substitute.For<SettingsDbContext>(new DbContextOptions<SettingsDbContext>());
        mockContext.ChatClientConfigurations.Returns(mockDbSet);

        var handler = new SetLlmConfigHandler(mockContext);
        var request = new SetLlmConfigRequest
        {
            UserId = userId,
            ProviderName = "new-provider",
            Endpoint = new Uri("http://new-endpoint"),
            ModelName = "new-model",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ProviderName.ShouldBe("new-provider");
        result.Value.Endpoint.ShouldBe(new Uri("http://new-endpoint"));
        result.Value.ModelName.ShouldBe("new-model");
    }

    [Fact]
    public async Task WhenConfigDoesNotExist_ReturnsEntityNotFound()
    {
        // Arrange
        var mockDbSet = new List<ChatClientConfiguration>().BuildMockDbSet();
        var mockContext = Substitute.For<SettingsDbContext>(new DbContextOptions<SettingsDbContext>());
        mockContext.ChatClientConfigurations.Returns(mockDbSet);

        var handler = new SetLlmConfigHandler(mockContext);
        var request = new SetLlmConfigRequest
        {
            UserId = Guid.NewGuid(),
            ProviderName = "new-provider",
            Endpoint = new Uri("http://new-endpoint"),
            ModelName = "new-model",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenDatabaseFails_ReturnsDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<SettingsDbContext>(new DbContextOptions<SettingsDbContext>());
        mockContext.ChatClientConfigurations.Throws(new InvalidOperationException("Database failure"));

        var handler = new SetLlmConfigHandler(mockContext);
        var request = new SetLlmConfigRequest
        {
            UserId = Guid.NewGuid(),
            ProviderName = "new-provider",
            Endpoint = new Uri("http://new-endpoint"),
            ModelName = "new-model",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }
}
