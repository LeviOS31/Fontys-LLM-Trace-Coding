using AxialCodes.Data;
using AxialCodes.Data.Models;
using AxialCodes.Features.GenerateAxialCodingResult;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using MockQueryable.NSubstitute;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Settings.Contracts.Features.GetLlmConfig;
using Shared;
using Shared.Interfaces;
using Traces.Contracts.Features.GetVersionOpencode;

namespace AxialCodes.Tests.Features.GenerateAxialCodingResult;

public class GenerateAxialCodingResultHandlerTests
{
    [Fact]
    public async Task WhenGetOpenCodesReturnsError_ReturnErrorCode()
    {
        // Arrange
        var mockContext = Substitute.For<AxialCodeDbContext>(new DbContextOptionsBuilder<AxialCodeDbContext>().Options);
        var mediator = Substitute.For<IMediator>();
        var chatClientBuilder = Substitute.For<IChatClientBuilder>();

        mediator.Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.NoPermission);

        var handler = new GenerateAxialCodingResultHandler(mockContext, mediator, chatClientBuilder);

        var request = new GenerateAxialCodingResultRequest
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000100"),
            ProjectVersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000101"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000102"),
            Feedback = null,
            AxialCodes = null,
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.NoPermission, result.ErrorCode);
        await mockContext.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenNoOpenCodes_ReturnNoOpenCodes()
    {
        // Arrange
        var mockContext = Substitute.For<AxialCodeDbContext>(new DbContextOptionsBuilder<AxialCodeDbContext>().Options);
        var mediator = Substitute.For<IMediator>();
        var chatClientBuilder = Substitute.For<IChatClientBuilder>();

        mediator
            .Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>())
            .Returns(new GetVersionOpencodeResponse { Opencodes = [] });

        var handler = new GenerateAxialCodingResultHandler(mockContext, mediator, chatClientBuilder);

        var request = new GenerateAxialCodingResultRequest
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000100"),
            ProjectVersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000101"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000102"),
            Feedback = null,
            AxialCodes = null,
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.NoOpenCodes, result.ErrorCode);
        await mockContext.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenGetLlmConfigReturnsError_ReturnLlmError()
    {
        // Arrange
        var mockContext = Substitute.For<AxialCodeDbContext>(new DbContextOptionsBuilder<AxialCodeDbContext>().Options);
        var mediator = Substitute.For<IMediator>();
        var chatClientBuilder = Substitute.For<IChatClientBuilder>();

        mediator
            .Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetVersionOpencodeResponse
                {
                    Opencodes =
                    [
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = new Guid("B1B2C3D4-0000-0000-0000-000000000201"),
                            OpenCode = "Open code A",
                        },
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = new Guid("B1B2C3D4-0000-0000-0000-000000000202"),
                            OpenCode = "Open code B",
                        },
                    ],
                }
            );

        mediator.Send(Arg.Any<GetLlmConfigQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.LlmError);

        var handler = new GenerateAxialCodingResultHandler(mockContext, mediator, chatClientBuilder);

        var request = new GenerateAxialCodingResultRequest
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000100"),
            ProjectVersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000101"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000102"),
            Feedback = null,
            AxialCodes = null,
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.LlmError, result.ErrorCode);
        await mockContext.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenChatClientThrows_ReturnLlmError()
    {
        // Arrange
        var mockContext = Substitute.For<AxialCodeDbContext>(new DbContextOptionsBuilder<AxialCodeDbContext>().Options);
        var mediator = Substitute.For<IMediator>();
        var chatClientBuilder = Substitute.For<IChatClientBuilder>();
        var chatClient = Substitute.For<IChatClient>();

        mediator
            .Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetVersionOpencodeResponse
                {
                    Opencodes =
                    [
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = new Guid("B1B2C3D4-0000-0000-0000-000000000201"),
                            OpenCode = "Open code A",
                        },
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = new Guid("B1B2C3D4-0000-0000-0000-000000000202"),
                            OpenCode = "Open code B",
                        },
                    ],
                }
            );

        mediator
            .Send(Arg.Any<GetLlmConfigQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetLlmConfigResponse
                {
                    ProviderName = "openai",
                    Endpoint = new Uri("https://fake-llm.local"),
                    ModelName = "gpt-test",
                }
            );

        chatClientBuilder.WithProvider(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.WithEndpoint(Arg.Any<Uri>()).Returns(chatClientBuilder);
        chatClientBuilder.WithModel(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.Build().Returns(Result.Success(chatClient));

        chatClient
            .GetResponseAsync(Arg.Any<IEnumerable<ChatMessage>>(), Arg.Any<ChatOptions>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("simulated failure"));

        var handler = new GenerateAxialCodingResultHandler(mockContext, mediator, chatClientBuilder);

        var request = new GenerateAxialCodingResultRequest
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000100"),
            ProjectVersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000101"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000102"),
            Feedback = null,
            AxialCodes = null,
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.LlmError, result.ErrorCode);
        await mockContext.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenLlmReturnsInvalidJson_ReturnLlmError()
    {
        // Arrange
        var mockContext = Substitute.For<AxialCodeDbContext>(new DbContextOptionsBuilder<AxialCodeDbContext>().Options);
        var mediator = Substitute.For<IMediator>();
        var chatClientBuilder = Substitute.For<IChatClientBuilder>();
        var chatClient = Substitute.For<IChatClient>();

        mediator
            .Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetVersionOpencodeResponse
                {
                    Opencodes =
                    [
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = new Guid("B1B2C3D4-0000-0000-0000-000000000201"),
                            OpenCode = "Open code A",
                        },
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = new Guid("B1B2C3D4-0000-0000-0000-000000000202"),
                            OpenCode = "Open code B",
                        },
                    ],
                }
            );

        mediator
            .Send(Arg.Any<GetLlmConfigQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetLlmConfigResponse
                {
                    ProviderName = "openai",
                    Endpoint = new Uri("https://fake-llm.local"),
                    ModelName = "gpt-test",
                }
            );

        chatClientBuilder.WithProvider(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.WithEndpoint(Arg.Any<Uri>()).Returns(chatClientBuilder);
        chatClientBuilder.WithModel(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.Build().Returns(Result.Success(chatClient));

        chatClient
            .GetResponseAsync(Arg.Any<IEnumerable<ChatMessage>>(), Arg.Any<ChatOptions>(), Arg.Any<CancellationToken>())
            .Returns(new ChatResponse([new ChatMessage(ChatRole.Assistant, "not-json")]));

        var handler = new GenerateAxialCodingResultHandler(mockContext, mediator, chatClientBuilder);

        var request = new GenerateAxialCodingResultRequest
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000100"),
            ProjectVersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000101"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000102"),
            Feedback = null,
            AxialCodes = null,
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.LlmError, result.ErrorCode);
        await mockContext.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenLlmReturnsUnmappedOpenCodeIds_ReturnLlmError()
    {
        // Arrange
        var mockContext = Substitute.For<AxialCodeDbContext>(new DbContextOptionsBuilder<AxialCodeDbContext>().Options);
        var mediator = Substitute.For<IMediator>();
        var chatClientBuilder = Substitute.For<IChatClientBuilder>();
        var chatClient = Substitute.For<IChatClient>();

        mediator
            .Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetVersionOpencodeResponse
                {
                    Opencodes =
                    [
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = new Guid("B1B2C3D4-0000-0000-0000-000000000201"),
                            OpenCode = "Open code A",
                        },
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = new Guid("B1B2C3D4-0000-0000-0000-000000000202"),
                            OpenCode = "Open code B",
                        },
                    ],
                }
            );

        mediator
            .Send(Arg.Any<GetLlmConfigQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetLlmConfigResponse
                {
                    ProviderName = "openai",
                    Endpoint = new Uri("https://fake-llm.local"),
                    ModelName = "gpt-test",
                }
            );

        chatClientBuilder.WithProvider(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.WithEndpoint(Arg.Any<Uri>()).Returns(chatClientBuilder);
        chatClientBuilder.WithModel(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.Build().Returns(Result.Success(chatClient));

        chatClient
            .GetResponseAsync(Arg.Any<IEnumerable<ChatMessage>>(), Arg.Any<ChatOptions>(), Arg.Any<CancellationToken>())
            .Returns(
                new ChatResponse([
                    new ChatMessage(
                        ChatRole.Assistant,
                        "[{\"label\":\"L1\",\"description\":\"D1\",\"openCodeIds\":[99]}]"
                    ),
                ])
            );

        var handler = new GenerateAxialCodingResultHandler(mockContext, mediator, chatClientBuilder);

        var request = new GenerateAxialCodingResultRequest
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000100"),
            ProjectVersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000101"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000102"),
            Feedback = null,
            AxialCodes = null,
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.LlmError, result.ErrorCode);
        await mockContext.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenSaveChangesThrows_ReturnDatabaseError()
    {
        // Arrange
        var mockSet = new List<AxialCodingResult>().BuildMockDbSet();
        var mockContext = Substitute.For<AxialCodeDbContext>(new DbContextOptionsBuilder<AxialCodeDbContext>().Options);
        mockContext.AxialCodingResults.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Throws(new DbUpdateException());

        var mediator = Substitute.For<IMediator>();
        var chatClientBuilder = Substitute.For<IChatClientBuilder>();
        var chatClient = Substitute.For<IChatClient>();

        mediator
            .Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetVersionOpencodeResponse
                {
                    Opencodes =
                    [
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = new Guid("B1B2C3D4-0000-0000-0000-000000000201"),
                            OpenCode = "Open code A",
                        },
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = new Guid("B1B2C3D4-0000-0000-0000-000000000202"),
                            OpenCode = "Open code B",
                        },
                    ],
                }
            );

        mediator
            .Send(Arg.Any<GetLlmConfigQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetLlmConfigResponse
                {
                    ProviderName = "openai",
                    Endpoint = new Uri("https://fake-llm.local"),
                    ModelName = "gpt-test",
                }
            );

        chatClientBuilder.WithProvider(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.WithEndpoint(Arg.Any<Uri>()).Returns(chatClientBuilder);
        chatClientBuilder.WithModel(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.Build().Returns(Result.Success(chatClient));

        chatClient
            .GetResponseAsync(Arg.Any<IEnumerable<ChatMessage>>(), Arg.Any<ChatOptions>(), Arg.Any<CancellationToken>())
            .Returns(
                new ChatResponse([
                    new ChatMessage(
                        ChatRole.Assistant,
                        "[{\"label\":\"L1\",\"description\":\"D1\",\"openCodeIds\":[1,2]}]"
                    ),
                ])
            );

        var handler = new GenerateAxialCodingResultHandler(mockContext, mediator, chatClientBuilder);

        var request = new GenerateAxialCodingResultRequest
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000100"),
            ProjectVersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000101"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000102"),
            Feedback = null,
            AxialCodes = null,
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.DatabaseError, result.ErrorCode);
    }

    [Fact]
    public async Task WhenSaveChangesReturnsZero_ReturnNoChanges()
    {
        // Arrange
        var mockSet = new List<AxialCodingResult>().BuildMockDbSet();
        var mockContext = Substitute.For<AxialCodeDbContext>(new DbContextOptionsBuilder<AxialCodeDbContext>().Options);
        mockContext.AxialCodingResults.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(0);

        var mediator = Substitute.For<IMediator>();
        var chatClientBuilder = Substitute.For<IChatClientBuilder>();
        var chatClient = Substitute.For<IChatClient>();

        mediator
            .Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetVersionOpencodeResponse
                {
                    Opencodes =
                    [
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = new Guid("B1B2C3D4-0000-0000-0000-000000000201"),
                            OpenCode = "Open code A",
                        },
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = new Guid("B1B2C3D4-0000-0000-0000-000000000202"),
                            OpenCode = "Open code B",
                        },
                    ],
                }
            );

        mediator
            .Send(Arg.Any<GetLlmConfigQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetLlmConfigResponse
                {
                    ProviderName = "openai",
                    Endpoint = new Uri("https://fake-llm.local"),
                    ModelName = "gpt-test",
                }
            );

        chatClientBuilder.WithProvider(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.WithEndpoint(Arg.Any<Uri>()).Returns(chatClientBuilder);
        chatClientBuilder.WithModel(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.Build().Returns(Result.Success(chatClient));

        chatClient
            .GetResponseAsync(Arg.Any<IEnumerable<ChatMessage>>(), Arg.Any<ChatOptions>(), Arg.Any<CancellationToken>())
            .Returns(
                new ChatResponse([
                    new ChatMessage(
                        ChatRole.Assistant,
                        "[{\"label\":\"L1\",\"description\":\"D1\",\"openCodeIds\":[1,2]}]"
                    ),
                ])
            );

        var handler = new GenerateAxialCodingResultHandler(mockContext, mediator, chatClientBuilder);

        var request = new GenerateAxialCodingResultRequest
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000100"),
            ProjectVersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000101"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000102"),
            Feedback = null,
            AxialCodes = null,
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorCode.NoChanges, result.ErrorCode);
    }

    [Fact]
    public async Task WhenRequestIsValid_ReturnsAxialCodingResult()
    {
        // Arrange
        var mockSet = new List<AxialCodingResult>().BuildMockDbSet();
        var mockContext = Substitute.For<AxialCodeDbContext>(new DbContextOptionsBuilder<AxialCodeDbContext>().Options);
        mockContext.AxialCodingResults.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var mediator = Substitute.For<IMediator>();
        var chatClientBuilder = Substitute.For<IChatClientBuilder>();
        var chatClient = Substitute.For<IChatClient>();

        var traceId1 = new Guid("B1B2C3D4-0000-0000-0000-000000000201");
        var traceId2 = new Guid("B1B2C3D4-0000-0000-0000-000000000202");

        mediator
            .Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetVersionOpencodeResponse
                {
                    Opencodes =
                    [
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = traceId1,
                            OpenCode = "Open code A",
                        },
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = traceId2,
                            OpenCode = "Open code B",
                        },
                    ],
                }
            );

        mediator
            .Send(Arg.Any<GetLlmConfigQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetLlmConfigResponse
                {
                    ProviderName = "openai",
                    Endpoint = new Uri("https://fake-llm.local"),
                    ModelName = "gpt-test",
                }
            );

        chatClientBuilder.WithProvider(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.WithEndpoint(Arg.Any<Uri>()).Returns(chatClientBuilder);
        chatClientBuilder.WithModel(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.Build().Returns(Result.Success(chatClient));

        chatClient
            .GetResponseAsync(Arg.Any<IEnumerable<ChatMessage>>(), Arg.Any<ChatOptions>(), Arg.Any<CancellationToken>())
            .Returns(
                new ChatResponse([
                    new ChatMessage(
                        ChatRole.Assistant,
                        "[{\"label\":\"L1\",\"description\":\"D1\",\"openCodeIds\":[1,2]}]"
                    ),
                ])
            );

        var handler = new GenerateAxialCodingResultHandler(mockContext, mediator, chatClientBuilder);

        var request = new GenerateAxialCodingResultRequest
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000100"),
            ProjectVersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000101"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000102"),
            Feedback = null,
            AxialCodes = null,
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotEqual(Guid.Empty, result.Value.AxialCodingResultId);
        var axialCode = result.Value.AxialCodes!.Single();
        Assert.Equal("L1", axialCode.Label);
        Assert.Equal("D1", axialCode.Description);
        Assert.Equal([traceId1, traceId2], axialCode.TraceIds);
        await mockContext.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenFeedbackAndPreviousAxialCodesProvided_UsesFeedbackFlow()
    {
        // Arrange
        var mockSet = new List<AxialCodingResult>().BuildMockDbSet();
        var mockContext = Substitute.For<AxialCodeDbContext>(new DbContextOptionsBuilder<AxialCodeDbContext>().Options);
        mockContext.AxialCodingResults.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var mediator = Substitute.For<IMediator>();
        var chatClientBuilder = Substitute.For<IChatClientBuilder>();
        var chatClient = Substitute.For<IChatClient>();

        var traceId1 = new Guid("B1B2C3D4-0000-0000-0000-000000000201");
        var traceId2 = new Guid("B1B2C3D4-0000-0000-0000-000000000202");

        mediator
            .Send(Arg.Any<GetVersionOpencodeQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetVersionOpencodeResponse
                {
                    Opencodes =
                    [
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = traceId1,
                            OpenCode = "Open code A",
                        },
                        new GetVersionOpencodeResponse.OpencodeViewModel
                        {
                            TraceId = traceId2,
                            OpenCode = "Open code B",
                        },
                    ],
                }
            );

        mediator
            .Send(Arg.Any<GetLlmConfigQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetLlmConfigResponse
                {
                    ProviderName = "openai",
                    Endpoint = new Uri("https://fake-llm.local"),
                    ModelName = "gpt-test",
                }
            );

        chatClientBuilder.WithProvider(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.WithEndpoint(Arg.Any<Uri>()).Returns(chatClientBuilder);
        chatClientBuilder.WithModel(Arg.Any<string>()).Returns(chatClientBuilder);
        chatClientBuilder.Build().Returns(Result.Success(chatClient));

        chatClient
            .GetResponseAsync(Arg.Any<IEnumerable<ChatMessage>>(), Arg.Any<ChatOptions>(), Arg.Any<CancellationToken>())
            .Returns(
                new ChatResponse([
                    new ChatMessage(
                        ChatRole.Assistant,
                        "[{\"label\":\"L1\",\"description\":\"D1\",\"openCodeIds\":[1,2]}]"
                    ),
                ])
            );

        var handler = new GenerateAxialCodingResultHandler(mockContext, mediator, chatClientBuilder);

        var request = new GenerateAxialCodingResultRequest
        {
            ProjectId = new Guid("A1B2C3D4-0000-0000-0000-000000000100"),
            ProjectVersionId = new Guid("A1B2C3D4-0000-0000-0000-000000000101"),
            UserId = new Guid("A1B2C3D4-0000-0000-0000-000000000102"),
            Feedback = "Please refine",
            AxialCodes =
            [
                new AxialCodeViewModel
                {
                    Label = "Old",
                    Description = "Old Desc",
                    TraceIds = [traceId1],
                },
            ],
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value.AxialCodes);
        await mockContext.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
