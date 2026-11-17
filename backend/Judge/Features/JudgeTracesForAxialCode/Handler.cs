using System.Text.Json;
using System.Text.Json.Serialization;
using Judge.Data;
using Judge.Data.Models;
using JudgeTemplates.Contracts.Features.InternalGetJudgeTemplates;
using Mediator;
using Microsoft.Extensions.AI;
using Serilog;
using Settings.Contracts.Features.GetLlmConfig;
using Shared;
using Shared.Interfaces;
using Traces.Contracts.Features.InternalGetTraceTranscripts;

namespace Judge.Features.JudgeTracesForAxialCode;

public class JudgeTracesForAxialCodeHandler
    : IRequestHandler<JudgeTracesForAxialCodeRequest, Result<JudgeTracesForAxialCodeResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<JudgeTracesForAxialCodeHandler>();

    private static readonly JsonSerializerOptions LlmJsonOptions = new() { PropertyNameCaseInsensitive = true };

    private const string OutputFormatInstruction = """

        Finish your response with exactly one JSON object and nothing after it:
        {"reasoning": "<your non-empty explanation of the verdict>", "result": true or false}
        """;

    private readonly JudgeDbContext _dbContext;
    private readonly IMediator _mediator;
    private readonly IChatClientBuilder _chatClientBuilder;

    public JudgeTracesForAxialCodeHandler(
        JudgeDbContext dbContext,
        IMediator mediator,
        IChatClientBuilder chatClientBuilder
    )
    {
        _dbContext = dbContext;
        _mediator = mediator;
        _chatClientBuilder = chatClientBuilder;
    }

    public async ValueTask<Result<JudgeTracesForAxialCodeResponse>> Handle(
        JudgeTracesForAxialCodeRequest request,
        CancellationToken cancellationToken
    )
    {
        // 2. Judge template content
        var templateResult = await _mediator.Send(
            new InternalGetJudgeTemplatesRequest
            {
                ProjectId = request.ProjectId,
                ProjectVersionId = request.ProjectVersionId,
                judgeIds = request.JudgeTemplateIds,
                UserId = request.UserId,
            },
            cancellationToken
        );
        if (templateResult.IsError)
        {
            return templateResult.ErrorCode!.Value;
        }

        // 3. Trace transcripts
        var transcriptsResult = await _mediator.Send(
            new InternalGetTraceTranscriptsRequest
            {
                ProjectId = request.ProjectId,
                ProjectVersionId = request.ProjectVersionId,
                UserId = request.UserId,
                TraceCollectionId = request.TraceCollectionId,
                TraceCollectionIds = request.TraceCollectionIds,
                TraceId = request.TraceId,
            },
            cancellationToken
        );
        if (transcriptsResult.IsError)
        {
            return transcriptsResult.ErrorCode!.Value;
        }

        var transcripts = transcriptsResult.Value.Transcripts.ToList();

        var tracesToJudge = request.TraceId.HasValue
            ? transcripts.Where(t => t.TraceId == request.TraceId.Value).ToList()
            : request.TraceCollectionId.HasValue || request.TraceCollectionIds is { Length: > 0 }
                ? transcripts
                : transcripts;

        if (request.TraceId.HasValue && tracesToJudge.Count != 1)
        {
            return ErrorCode.EntityNotFound;
        }

        // 4. Judge each trace
        var resultsformatted = new List<List<TraceJudgeResultViewModel>>();
        foreach (var judge in templateResult.Value.JudgeTemplates)
        {
            var results = new List<TraceJudgeResultViewModel>();
            foreach (var trace in tracesToJudge)
            {
                var result = await JudgeSingleTraceAsync(
                    request.UserId,
                    judge.Content,
                    trace.Transcript,
                    cancellationToken
                );
                results.Add(
                    new TraceJudgeResultViewModel
                    {
                        TraceId = trace.TraceId,
                        JudgeTemplateId = judge.JudgeTemplateId,
                        Status = result.IsError ? "Error" : "Success",
                        Verdict = result.IsError ? null : (result.Value.Result ? "True" : "False"),
                        Reasoning = result.IsError ? null : result.Value.Reasoning,
                        Error = result.IsError ? result.ErrorCode!.Value.ToString() : null,
                    }
                );
            }

            resultsformatted.Add(results);
        }

        // 5. Persist the run
        JudgeCollection judgeCollection = new JudgeCollection
        {
            JudgeCollectionId = new Guid(),
            ProjectVersionId = request.ProjectVersionId,
            CreatedAt = DateTime.UtcNow,
            Name = $"Judge Collection {DateTime.UtcNow}",
        };

        try
        {
            _dbContext.JudgeCollections.Add(judgeCollection);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "Error saving judge collection");
            return ErrorCode.DatabaseError;
        }

        foreach (var judgeresults in resultsformatted)
        {
            var judgeRun = new JudgeRun
            {
                JudgeRunId = Guid.NewGuid(),
                JudgeCollectionId = judgeCollection.JudgeCollectionId,
                ResultsJson = JsonSerializer.Serialize(judgeresults),
                CreatedAt = DateTimeOffset.UtcNow,
                TotalCount = judgeresults.Count,
                TrueCount = judgeresults.Count(r => r.Status == "Success" && r.Verdict == "True"),
                FalseCount = judgeresults.Count(r => r.Status == "Success" && r.Verdict == "False"),
                FailedCount = judgeresults.Count(r => r.Status == "Error"),
            };

            judgeCollection.judgeRuns.Add(judgeRun);

            try
            {
                _dbContext.JudgeRuns.Add(judgeRun);
                
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error saving judge run");
                return ErrorCode.DatabaseError;
            }
        }

        return new JudgeTracesForAxialCodeResponse { JudgeCollectionId = judgeCollection.JudgeCollectionId, Results = resultsformatted };
    }

    private sealed record JudgeVerdict
    {
        public required bool Result { get; init; }
        public required string Reasoning { get; init; }
    }

    private sealed record JudgeResultJson
    {
        [JsonPropertyName("reasoning")]
        public required string Reasoning { get; init; }

        [JsonPropertyName("result")]
        public required bool Result { get; init; }
    }

    private static JudgeVerdict ParseJudgeResponse(string responseText)
    {
        var jsonEnd = responseText.LastIndexOf('}');
        if (jsonEnd < 0)
        {
            throw new JsonException("No JSON object found in judge response.");
        }

        // A '{' inside the reasoning text makes the slice invalid JSON, so walk back
        // over '{' positions until one deserializes into a complete object.
        JudgeResultJson? parsed = null;
        for (
            var i = responseText.LastIndexOf('{', jsonEnd);
            i >= 0;
            i = i == 0 ? -1 : responseText.LastIndexOf('{', i - 1)
        )
        {
            try
            {
                parsed = JsonSerializer.Deserialize<JudgeResultJson>(
                    responseText[i..(jsonEnd + 1)],
                    LlmJsonOptions
                );
                if (parsed is not null)
                {
                    break;
                }
            }
            catch (JsonException)
            {
                // Missing required property or invalid JSON: try an earlier '{'.
            }
        }

        if (parsed is null)
        {
            throw new JsonException("No valid JSON object with reasoning and result found in judge response.");
        }

        if (string.IsNullOrWhiteSpace(parsed.Reasoning))
        {
            throw new JsonException("Judge response contained no reasoning.");
        }

        return new JudgeVerdict { Result = parsed.Result, Reasoning = parsed.Reasoning.Trim() };
    }

    private async Task<Result<JudgeVerdict>> JudgeSingleTraceAsync(
        Guid userId,
        string judgeInstructions,
        string traceContent,
        CancellationToken cancellationToken
    )
    {
        var chatClientResult = await GetChatClientAsync(userId, cancellationToken);
        if (chatClientResult.IsError)
        {
            return chatClientResult.ErrorCode;
        }

        var messages = new List<ChatMessage>
        {
            new(ChatRole.User, $"{judgeInstructions}\n\nTrace to evaluate:\n{traceContent}\n{OutputFormatInstruction}"),
        };

        // Constrains the model to {"reasoning": string, "result": bool}, both required.
        var options = new ChatOptions
        {
            ResponseFormat = ChatResponseFormat.ForJsonSchema<JudgeResultJson>(LlmJsonOptions),
        };

        string responseText;
        try
        {
            var response = await chatClientResult.Value.GetResponseAsync(messages, options, cancellationToken);
            responseText = response.Text;
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "Error calling judge LLM");
            return ErrorCode.LlmError;
        }

        try
        {
            return ParseJudgeResponse(responseText);
        }
        catch (JsonException ex)
        {
            Logger.Error(ex, "Failed to parse judge LLM response: {Response}", responseText);
            return ErrorCode.LlmError;
        }
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
            .WithApiKey(llmConfigResult.Value.ApiKey)
            .Build();
    }
}