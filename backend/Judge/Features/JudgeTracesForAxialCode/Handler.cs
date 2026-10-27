using AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion;
using Judge.Data;
using Judge.Data.Models;
using JudgeTemplates.Contracts.Features.InternalGetJudgeTemplateByAxialCodeId;
using Mediator;
using Microsoft.Extensions.AI;
using Serilog;
using Settings.Contracts.Features.GetLlmConfig;
using Shared;
using Shared.Interfaces;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Traces.Contracts.Features.InternalGetTraceTranscripts;
using static AxialCodes.Contracts.Features.InternalGetAllAxialCodesByVersion.InternalGetAllAxialCodesByVersionResponse;

namespace Judge.Features.JudgeTracesForAxialCode;

public class JudgeTracesForAxialCodeHandler
    : IRequestHandler<JudgeTracesForAxialCodeRequest, Result<JudgeTracesForAxialCodeResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<JudgeTracesForAxialCodeHandler>();
    
    private static readonly JsonSerializerOptions LlmJsonOptions = new() { PropertyNameCaseInsensitive = true };

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
        AxialCodeEntry[] axialCode = axialCodesResult.Value.AxialCodes.Where(a => request.AxialCodeIds.Contains(a.AxialCodeId)).ToArray();
        if (axialCode is null || axialCode.Length == 0)
        {
            return ErrorCode.EntityNotFound;
        }

        // 2. Judge template content
        var templateResult = await _mediator.Send(
            new InternalGetJudgeTemplateByAxialCodeIdRequest
            {
                ProjectId = request.ProjectId,
                ProjectVersionId = request.ProjectVersionId,
                AxialCodeIds = request.AxialCodeIds,
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

        var traceIdSet = axialCode.SelectMany(a => a.TraceIds).ToHashSet();

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
            foreach (var judge in templateResult.Value.JudgeTemplates)
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
        }

        // 5. Persist the run
        var judgeRun = new JudgeRun
        {
            JudgeRunId = Guid.NewGuid(),
            ProjectId = request.ProjectId,
            ProjectVersionId = request.ProjectVersionId,
            ResultsJson = JsonSerializer.Serialize(results),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        try
        {
            _dbContext.JudgeRuns.Add(judgeRun);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "Error saving judge run for axial code {AxialCodeId}", request.AxialCodeIds);
            return ErrorCode.DatabaseError;
        }

        return new JudgeTracesForAxialCodeResponse { JudgeRunId = judgeRun.JudgeRunId, Results = results };
    }

    private sealed record JudgeVerdict
{
    public required bool Result { get; init; }
    public string? Reasoning { get; init; }
}

private static JudgeVerdict ParseJudgeResponse(string responseText)
{
    // The template asks for free-text "Evaluation: ... Result: true/false"
    // followed by a trailing JSON object — pull the LAST { ... } block for the verdict,
    // and separately extract the "Evaluation:" prose as the reasoning.
    var jsonStart = responseText.LastIndexOf('{');
    var jsonEnd = responseText.LastIndexOf('}');
    if (jsonStart < 0 || jsonEnd < jsonStart)
    {
        throw new JsonException("No JSON object found in judge response.");
    }

    var jsonPart = responseText[jsonStart..(jsonEnd + 1)];
    var jsonResult = JsonSerializer.Deserialize<JudgeResultJson>(jsonPart, LlmJsonOptions)
        ?? throw new JsonException("Judge response JSON deserialized to null.");

    var reasoningMatch = Regex.Match(
        responseText,
        @"Evaluation:\s*(.*?)\s*Result:",
        RegexOptions.Singleline | RegexOptions.IgnoreCase
    );
    var reasoning = reasoningMatch.Success ? reasoningMatch.Groups[1].Value.Trim() : null;

    return new JudgeVerdict { Result = jsonResult.Result, Reasoning = reasoning };
}

private sealed record JudgeResultJson
{
    [JsonPropertyName("result")]
    public required bool Result { get; init; }
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
            new(ChatRole.User, $"{judgeInstructions}\n\nTrace to evaluate:\n{traceContent}"),
        };

        string responseText;
        try
        {
            var response = await chatClientResult.Value.GetResponseAsync(messages, cancellationToken: cancellationToken);
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