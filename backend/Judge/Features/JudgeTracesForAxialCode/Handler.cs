using System.Text.Json;
using System.Text.Json.Serialization;
using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using Judge.Data;
using Judge.Data.Models;
using JudgeTemplates.Contracts.Features.InternalGetJudgeTemplateByAxialCodeId;
using Mediator;
using Microsoft.Extensions.AI;
using Serilog;
using Settings.Contracts.Features.GetLlmConfig;
using Shared;
using Shared.Builders;
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
        // 1. Axial code (for its TraceIds)
        var axialCodesResult = await _mediator.Send(
            new InternalGetAllAxialCodesByVersionRequest
            {
                ProjectId = request.ProjectId,
                ProjectVersionId = request.ProjectVersionId,
                UserId = request.UserId,
            },
            cancellationToken
        );
        if (axialCodesResult.IsError)
        {
            return axialCodesResult.ErrorCode!.Value;
        }
        var axialCode = axialCodesResult.Value.AxialCodes.FirstOrDefault(a => a.AxialCodeId == request.AxialCodeId);
        if (axialCode is null)
        {
            return ErrorCode.EntityNotFound;
        }

        // 2. Judge template content
        var templateResult = await _mediator.Send(
            new InternalGetJudgeTemplateByAxialCodeIdRequest
            {
                ProjectId = request.ProjectId,
                ProjectVersionId = request.ProjectVersionId,
                AxialCodeId = request.AxialCodeId,
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
                TraceId = request.TraceId,
            },
            cancellationToken
        );
        if (transcriptsResult.IsError)
        {
            return transcriptsResult.ErrorCode!.Value;
        }

        var transcripts = transcriptsResult.Value.Transcripts.ToList();

        var traceIdSet = axialCode.TraceIds.ToHashSet();

        var tracesToJudge = request.TraceId.HasValue
            ? transcripts
                .Where(t => t.TraceId == request.TraceId.Value)
                .ToList()
            : request.TraceCollectionId.HasValue
                ? transcripts
                : transcripts
                    .Where(t => traceIdSet.Contains(t.TraceId))
                    .ToList();

        if (request.TraceId.HasValue && tracesToJudge.Count != 1)
        {
            return ErrorCode.EntityNotFound;
        }

        // 4. Judge each trace
        var results = new List<TraceJudgeResultViewModel>();
        foreach (var trace in tracesToJudge)
        {
            var result = await JudgeSingleTraceAsync(
                request.UserId,
                templateResult.Value.Content,
                trace.Transcript,
                cancellationToken
            );
            results.Add(
                new TraceJudgeResultViewModel
                {
                    TraceId = trace.TraceId,
                    Status = result.IsError ? "Error" : "Success",
                    Verdict = result.IsError ? null : (result.Value.Result ? "True" : "False"),
                    Reasoning = result.IsError ? null : result.Value.Reasoning,
                    Error = result.IsError ? result.ErrorCode!.Value.ToString() : null,
                }
            );
        }

        // 5. Persist the run
        var judgeRun = new JudgeRun
        {
            JudgeRunId = Guid.NewGuid(),
            ProjectId = request.ProjectId,
            ProjectVersionId = request.ProjectVersionId,
            AxialCodeId = request.AxialCodeId,
            ResultsJson = JsonSerializer.Serialize(results),
            CreatedAt = DateTimeOffset.UtcNow,
            TotalCount = results.Count,
            TrueCount = results.Count(r => r.Status == "Success" && r.Verdict == "True"),
            FalseCount = results.Count(r => r.Status == "Success" && r.Verdict == "False"),
            FailedCount = results.Count(r => r.Status == "Error"),
        };

        try
        {
            _dbContext.JudgeRuns.Add(judgeRun);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "Error saving judge run for axial code {AxialCodeId}", request.AxialCodeId);
            return ErrorCode.DatabaseError;
        }

        return new JudgeTracesForAxialCodeResponse { JudgeRunId = judgeRun.JudgeRunId, Results = results };
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
            .Build();
    }
}