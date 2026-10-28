using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using Judge.Data;
using Judge.Features.JudgeTracesForAxialCode;
using JudgeTemplates.Contracts.Features.InternalGetJudgeTemplateByAxialCodeId;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Settings.Contracts.Features.GetLlmConfig;
using Shared;
using Shared.Interfaces;
using Shouldly;
using Traces.Contracts.Features.InternalGetTraceTranscripts;

namespace Judge.Tests.Features.JudgeTracesForAxialCode;

public class JudgeTracesForAxialCodeHandlerTests
{
    private static readonly Guid _projectId = new("68DF6625-60EA-4E0A-8F29-29DE14197024");
    private static readonly Guid _projectVersionId = new("68DF6625-60EA-4E0A-8F29-29DE14197025");
    private static readonly Guid[] _axialCodeIds =
    {
        new("68DF6625-60EA-4E0A-8F29-29DE14197026")
    };
    private static readonly Guid _userId = new("CE97539F-4189-44FC-A87F-CFA3EDB177ED");
    private static readonly Guid _traceId1 = new("11111111-1111-1111-1111-111111111111");
    private static readonly Guid _traceId2 = new("22222222-2222-2222-2222-222222222222");

    private const string TemplateContent = "Template instructions";
    private const string TrueResponse = """{"reasoning": "The trace shows it.", "result": true}""";
    private const string FalseResponse = """{"reasoning": "Not present.", "result": false}""";

    private static DbContextOptions<JudgeDbContext> CreateOptions() =>
        new DbContextOptionsBuilder<JudgeDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

    private static JudgeTracesForAxialCodeRequest CreateRequest(Guid? traceId = null, Guid? traceCollectionId = null) =>
        new()
        {
            ProjectId = _projectId,
            ProjectVersionId = _projectVersionId,
            AxialCodeIds = _axialCodeIds,
            UserId = _userId,
            TraceId = traceId,
            TraceCollectionId = traceCollectionId,
        };

    private static Result<InternalGetAllAxialCodesByVersionResponse> AxialCodes(params Guid[] traceIds) =>
        new InternalGetAllAxialCodesByVersionResponse
        {
            AxialCodes =
            [
                new()
                {
                    AxialCodeId = _axialCodeIds[0],
                    Label = "Test Label",
                    Description = "Test Description",
                    IsActive = true,
                    TraceIds = traceIds.ToList(),
                },
            ],
        };

    // Target-typed new() avoids naming the transcript item type.
    private static Result<InternalGetTraceTranscriptsResponse> Transcripts(params Guid[] ids) =>
        ids.Length switch
        {
            0 => new InternalGetTraceTranscriptsResponse { Transcripts = [] },
            1 => new InternalGetTraceTranscriptsResponse
            {
                Transcripts = [new() { TraceId = ids[0], Transcript = $"transcript {ids[0]}" }],
            },
            2 => new InternalGetTraceTranscriptsResponse
            {
                Transcripts =
                [
                    new() { TraceId = ids[0], Transcript = $"transcript {ids[0]}" },
                    new() { TraceId = ids[1], Transcript = $"transcript {ids[1]}" },
                ],
            },
            _ => throw new ArgumentException("Helper supports at most two transcripts."),
        };

    private static IMediator CreateMediator(
        Result<InternalGetAllAxialCodesByVersionResponse>? axialCodes = null,
        Result<InternalGetJudgeTemplateByAxialCodeIdResponse>? template = null,
        Result<InternalGetTraceTranscriptsResponse>? transcripts = null,
        Result<GetLlmConfigResponse>? llmConfig = null
    )
    {
        var mediator = Substitute.For<IMediator>();

        mediator
            .Send(Arg.Any<InternalGetAllAxialCodesByVersionRequest>(), Arg.Any<CancellationToken>())
            .Returns(axialCodes ?? AxialCodes(_traceId1));

        mediator
            .Send(Arg.Any<InternalGetJudgeTemplateByAxialCodeIdRequest>(), Arg.Any<CancellationToken>())
            .Returns(
                template
                    ?? new InternalGetJudgeTemplateByAxialCodeIdResponse
                    {
                        JudgeTemplates =
                        [
                            new()
                            {
                                JudgeTemplateId = Guid.NewGuid(),
                                Content = TemplateContent,
                                IsDeprecated = false,
                            },
                        ],
                    }
            );

        mediator
            .Send(Arg.Any<InternalGetTraceTranscriptsRequest>(), Arg.Any<CancellationToken>())
            .Returns(transcripts ?? Transcripts(_traceId1));

        mediator
            .Send(Arg.Any<GetLlmConfigQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                llmConfig
                    ?? new GetLlmConfigResponse
                    {
                        ProviderName = "openai",
                        Endpoint = new Uri("http://localhost"),
                        ModelName = "test-model",
                    }
            );

        return mediator;
    }

    private static (IChatClientBuilder Builder, IChatClient Client) CreateChatClient(params string[] responses)
    {
        var client = Substitute.For<IChatClient>();
        var queue = new Queue<string>(responses);
        client
            .GetResponseAsync(
                Arg.Any<IEnumerable<ChatMessage>>(),
                Arg.Any<ChatOptions?>(),
                Arg.Any<CancellationToken>()
            )
            .Returns(_ => new ChatResponse(new ChatMessage(ChatRole.Assistant, queue.Dequeue())));

        return (CreateBuilder(client), client);
    }

    private static (IChatClientBuilder Builder, IChatClient Client) CreateThrowingChatClient()
    {
        var client = Substitute.For<IChatClient>();
        client
            .GetResponseAsync(
                Arg.Any<IEnumerable<ChatMessage>>(),
                Arg.Any<ChatOptions?>(),
                Arg.Any<CancellationToken>()
            )
            .ThrowsAsync(new InvalidOperationException("LLM unavailable"));

        return (CreateBuilder(client), client);
    }

    private sealed class StubChatClient(IChatClient inner) : DelegatingChatClient(inner);

    private sealed class FakeChatClientBuilder(IChatClient client) : IChatClientBuilder
    {
        public IChatClientBuilder WithProvider(string? provider) => this;
        public IChatClientBuilder WithEndpoint(Uri? endpoint) => this;
        public IChatClientBuilder WithModel(string? model) => this;
        public Result<IChatClient> Build() => new StubChatClient(client);
    }

    private static IChatClientBuilder CreateBuilder(IChatClient client) => new FakeChatClientBuilder(client);
    private static async Task AssertLlmNotCalled(IChatClient client) =>
        await client
            .DidNotReceive()
            .GetResponseAsync(
                Arg.Any<IEnumerable<ChatMessage>>(),
                Arg.Any<ChatOptions?>(),
                Arg.Any<CancellationToken>()
            );

    [Fact]
    public async Task WhenRequestIsValid_ReturnJudgeRunIdAndResult()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, _) = CreateChatClient(TrueResponse);
        var handler = new JudgeTracesForAxialCodeHandler(context, CreateMediator(), builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeRunId.ShouldNotBe(Guid.Empty);
        var item = result.Value.Results.Single();
        item.TraceId.ShouldBe(_traceId1);
        item.Status.ShouldBe("Success");
        item.Verdict.ShouldBe("True");
        item.Reasoning.ShouldBe("The trace shows it.");
        item.Error.ShouldBeNull();
    }

    [Fact]
    public async Task WhenVerdictIsFalse_ReturnFalseVerdictWithReasoning()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, _) = CreateChatClient(FalseResponse);
        var handler = new JudgeTracesForAxialCodeHandler(context, CreateMediator(), builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var item = result.Value!.Results.Single();
        item.Status.ShouldBe("Success");
        item.Verdict.ShouldBe("False");
        item.Reasoning.ShouldBe("Not present.");
    }

    [Fact]
    public async Task WhenRequestIsValid_PersistRunWithCounts()
    {
        // Arrange
        var options = CreateOptions();
        await using var context = new JudgeDbContext(options);
        var mediator = CreateMediator(
            axialCodes: AxialCodes(_traceId1, _traceId2),
            transcripts: Transcripts(_traceId1, _traceId2)
        );
        var (builder, _) = CreateChatClient(TrueResponse, FalseResponse);
        var handler = new JudgeTracesForAxialCodeHandler(context, mediator, builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        await using var verifyContext = new JudgeDbContext(options);
        var run = await verifyContext.JudgeRuns.SingleAsync();
        run.JudgeRunId.ShouldBe(result.Value!.JudgeRunId);
        run.ProjectId.ShouldBe(_projectId);
        run.ProjectVersionId.ShouldBe(_projectVersionId);
        run.TotalCount.ShouldBe(2);
        run.TrueCount.ShouldBe(1);
        run.FalseCount.ShouldBe(1);
        run.FailedCount.ShouldBe(0);
        run.ResultsJson.ShouldNotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task WhenLlmResponseHasProseBeforeJson_StillParseVerdictAndReasoning()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, _) = CreateChatClient($"Let me think about this.\n{TrueResponse}");
        var handler = new JudgeTracesForAxialCodeHandler(context, CreateMediator(), builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        var item = result.Value!.Results.Single();
        item.Status.ShouldBe("Success");
        item.Verdict.ShouldBe("True");
        item.Reasoning.ShouldBe("The trace shows it.");
    }

    [Fact]
    public async Task WhenReasoningContainsBraces_StillParseResponse()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, _) = CreateChatClient("""{"reasoning": "It uses {placeholders} here.", "result": true}""");
        var handler = new JudgeTracesForAxialCodeHandler(context, CreateMediator(), builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        var item = result.Value!.Results.Single();
        item.Status.ShouldBe("Success");
        item.Reasoning.ShouldBe("It uses {placeholders} here.");
    }

    [Fact]
    public async Task WhenReasoningHasSurroundingWhitespace_TrimReasoning()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, _) = CreateChatClient("""{"reasoning": "  Padded.  ", "result": true}""");
        var handler = new JudgeTracesForAxialCodeHandler(context, CreateMediator(), builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.Value!.Results.Single().Reasoning.ShouldBe("Padded.");
    }

    [Fact]
    public async Task WhenLlmResponseHasNoReasoning_StoreTraceAsErrorInsteadOfSuccess()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, _) = CreateChatClient("""{"result": true}""");
        var handler = new JudgeTracesForAxialCodeHandler(context, CreateMediator(), builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var item = result.Value!.Results.Single();
        item.Status.ShouldBe("Error");
        item.Verdict.ShouldBeNull();
        item.Reasoning.ShouldBeNull();
        item.Error.ShouldBe(ErrorCode.LlmError.ToString());
    }

    [Fact]
    public async Task WhenLlmResponseHasBlankReasoning_StoreTraceAsError()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, _) = CreateChatClient("""{"reasoning": "   ", "result": true}""");
        var handler = new JudgeTracesForAxialCodeHandler(context, CreateMediator(), builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        var item = result.Value!.Results.Single();
        item.Status.ShouldBe("Error");
        item.Verdict.ShouldBeNull();
        item.Error.ShouldBe(ErrorCode.LlmError.ToString());
    }

    [Fact]
    public async Task WhenLlmResponseHasNoJson_StoreTraceAsError()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, _) = CreateChatClient("Evaluation: looks fine. Result: true");
        var handler = new JudgeTracesForAxialCodeHandler(context, CreateMediator(), builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        var item = result.Value!.Results.Single();
        item.Status.ShouldBe("Error");
        item.Error.ShouldBe(ErrorCode.LlmError.ToString());
    }

    [Fact]
    public async Task WhenLlmThrows_StoreTraceAsErrorAndStillPersistRun()
    {
        // Arrange
        var options = CreateOptions();
        await using var context = new JudgeDbContext(options);
        var (builder, _) = CreateThrowingChatClient();
        var handler = new JudgeTracesForAxialCodeHandler(context, CreateMediator(), builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var item = result.Value!.Results.Single();
        item.Status.ShouldBe("Error");
        item.Error.ShouldBe(ErrorCode.LlmError.ToString());
        await using var verifyContext = new JudgeDbContext(options);
        var run = await verifyContext.JudgeRuns.SingleAsync();
        run.TotalCount.ShouldBe(1);
        run.FailedCount.ShouldBe(1);
        run.TrueCount.ShouldBe(0);
        run.FalseCount.ShouldBe(0);
    }

    [Fact]
    public async Task WhenOneTraceFails_OtherTracesStillSucceed()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var mediator = CreateMediator(
            axialCodes: AxialCodes(_traceId1, _traceId2),
            transcripts: Transcripts(_traceId1, _traceId2)
        );
        var (builder, _) = CreateChatClient("""{"result": true}""", TrueResponse);
        var handler = new JudgeTracesForAxialCodeHandler(context, mediator, builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        var results = result.Value!.Results.ToList();
        results[0].Status.ShouldBe("Error");
        results[1].Status.ShouldBe("Success");
        results[1].Verdict.ShouldBe("True");
    }

    [Fact]
    public async Task WhenLlmConfigFails_StoreTraceAsErrorWithThatCode()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, client) = CreateChatClient();
        var mediator = CreateMediator(llmConfig: ErrorCode.EntityNotFound);
        var handler = new JudgeTracesForAxialCodeHandler(context, mediator, builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        var item = result.Value!.Results.Single();
        item.Status.ShouldBe("Error");
        item.Error.ShouldBe(ErrorCode.EntityNotFound.ToString());
        await AssertLlmNotCalled(client);
    }

    [Fact]
    public async Task WhenAxialCodesRequestFails_ReturnErrorWithoutCallingLlm()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, client) = CreateChatClient();
        var mediator = CreateMediator(axialCodes: ErrorCode.EntityNotFound);
        var handler = new JudgeTracesForAxialCodeHandler(context, mediator, builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        await AssertLlmNotCalled(client);
    }

    [Fact]
    public async Task WhenAxialCodeIsNotInVersion_ReturnEntityNotFound()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, client) = CreateChatClient();
        var mediator = CreateMediator(axialCodes: new InternalGetAllAxialCodesByVersionResponse { AxialCodes = [] });
        var handler = new JudgeTracesForAxialCodeHandler(context, mediator, builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        await AssertLlmNotCalled(client);
    }

    [Fact]
    public async Task WhenTemplateRequestFails_ReturnError()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, client) = CreateChatClient();
        var mediator = CreateMediator(template: ErrorCode.EntityNotFound);
        var handler = new JudgeTracesForAxialCodeHandler(context, mediator, builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        await AssertLlmNotCalled(client);
    }

    [Fact]
    public async Task WhenTranscriptsRequestFails_ReturnError()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, client) = CreateChatClient();
        var mediator = CreateMediator(transcripts: ErrorCode.EntityNotFound);
        var handler = new JudgeTracesForAxialCodeHandler(context, mediator, builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        await AssertLlmNotCalled(client);
    }

    [Fact]
    public async Task WhenFailing_DoNotPersistRun()
    {
        // Arrange
        var options = CreateOptions();
        await using var context = new JudgeDbContext(options);
        var (builder, _) = CreateChatClient();
        var mediator = CreateMediator(axialCodes: ErrorCode.EntityNotFound);
        var handler = new JudgeTracesForAxialCodeHandler(context, mediator, builder);

        // Act
        _ = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        await using var verifyContext = new JudgeDbContext(options);
        (await verifyContext.JudgeRuns.AnyAsync()).ShouldBeFalse();
    }

    [Fact]
    public async Task WhenNoTraceFilterIsGiven_OnlyJudgeTracesOfTheAxialCode()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, client) = CreateChatClient(TrueResponse);
        var mediator = CreateMediator(
            axialCodes: AxialCodes(_traceId1),
            transcripts: Transcripts(_traceId1, _traceId2)
        );
        var handler = new JudgeTracesForAxialCodeHandler(context, mediator, builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.Results.Select(r => r.TraceId).ToList().ShouldBe([_traceId1]);
        await client
            .Received(1)
            .GetResponseAsync(
                Arg.Any<IEnumerable<ChatMessage>>(),
                Arg.Any<ChatOptions?>(),
                Arg.Any<CancellationToken>()
            );
    }

    [Fact]
    public async Task WhenTraceCollectionIdIsGiven_JudgeAllReturnedTranscripts()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, _) = CreateChatClient(TrueResponse, TrueResponse);
        var mediator = CreateMediator(
            axialCodes: AxialCodes(_traceId1),
            transcripts: Transcripts(_traceId1, _traceId2)
        );
        var handler = new JudgeTracesForAxialCodeHandler(context, mediator, builder);

        // Act
        var result = await handler.Handle(CreateRequest(traceCollectionId: Guid.NewGuid()), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.Results.Select(r => r.TraceId).ToList().ShouldBe([_traceId1, _traceId2]);
    }

    [Fact]
    public async Task WhenTraceIdIsGiven_OnlyJudgeThatTrace()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, _) = CreateChatClient(TrueResponse);
        var mediator = CreateMediator(transcripts: Transcripts(_traceId1, _traceId2));
        var handler = new JudgeTracesForAxialCodeHandler(context, mediator, builder);

        // Act
        var result = await handler.Handle(CreateRequest(traceId: _traceId2), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.Results.Single().TraceId.ShouldBe(_traceId2);
    }

    [Fact]
    public async Task WhenTraceIdIsGivenButNotFound_ReturnEntityNotFound()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, client) = CreateChatClient();
        var mediator = CreateMediator(transcripts: Transcripts(_traceId1));
        var handler = new JudgeTracesForAxialCodeHandler(context, mediator, builder);

        // Act
        var result = await handler.Handle(CreateRequest(traceId: _traceId2), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        await AssertLlmNotCalled(client);
    }

    [Fact]
    public async Task WhenNoTracesMatch_ReturnSuccessWithEmptyRun()
    {
        // Arrange
        var options = CreateOptions();
        await using var context = new JudgeDbContext(options);
        var (builder, client) = CreateChatClient();
        var mediator = CreateMediator(axialCodes: AxialCodes(), transcripts: Transcripts(_traceId1));
        var handler = new JudgeTracesForAxialCodeHandler(context, mediator, builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.Results.ShouldBeEmpty();
        await AssertLlmNotCalled(client);
        await using var verifyContext = new JudgeDbContext(options);
        (await verifyContext.JudgeRuns.SingleAsync()).TotalCount.ShouldBe(0);
    }

    [Fact]
    public async Task WhenRequestIsValid_SendTemplateAndTranscriptToLlmWithResponseFormat()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, client) = CreateChatClient(TrueResponse);
        var handler = new JudgeTracesForAxialCodeHandler(context, CreateMediator(), builder);

        // Act
        _ = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        await client
            .Received(1)
            .GetResponseAsync(
                Arg.Is<IEnumerable<ChatMessage>>(messages =>
                    messages.Single().Text.Contains(TemplateContent)
                    && messages.Single().Text.Contains($"transcript {_traceId1}")
                    && messages.Single().Text.Contains("\"reasoning\"")
                ),
                Arg.Is<ChatOptions?>(options => options != null && options.ResponseFormat != null),
                Arg.Any<CancellationToken>()
            );
    }

    [Fact]
    public async Task WhenLlmReturnsUnusableResponse_CallLlmOnlyOncePerTrace()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var (builder, client) = CreateChatClient("not json at all");
        var handler = new JudgeTracesForAxialCodeHandler(context, CreateMediator(), builder);

        // Act
        _ = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        await client
            .Received(1)
            .GetResponseAsync(
                Arg.Any<IEnumerable<ChatMessage>>(),
                Arg.Any<ChatOptions?>(),
                Arg.Any<CancellationToken>()
            );
    }

    [Fact]
    public async Task WhenDatabaseThrowsDbUpdateException_ReturnDatabaseError()
    {
        // Arrange
        var context = Substitute.ForPartsOf<JudgeDbContext>(CreateOptions());
        context.SaveChangesAsync(Arg.Any<CancellationToken>()).ThrowsAsync(new DbUpdateException());
        var (builder, _) = CreateChatClient(TrueResponse);
        var handler = new JudgeTracesForAxialCodeHandler(context, CreateMediator(), builder);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }
}