using System.Data.Common;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using AxialCodes.Data;
using AxialCodes.Data.Models;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Serilog;
using Settings.Contracts.Features.GetLlmConfig;
using Shared;
using Shared.Builders;
using Shared.Interfaces;
using Traces.Contracts.Features.GetVersionOpencode;

namespace AxialCodes.Features.GenerateAxialCodingResult;

public class GenerateAxialCodingResultHandler
    : IRequestHandler<GenerateAxialCodingResultRequest, Result<GenerateAxialCodingResultResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GenerateAxialCodingResultHandler>();

    private static readonly Lazy<string> _axialCodingPrompt = new(() =>
        LoadPrompt("AxialCodes.Resources.Prompts.AxialCodingPrompt.txt")
    );
    private static readonly Lazy<string> _axialCodingWithFeedbackPrompt = new(() =>
        LoadPrompt("AxialCodes.Resources.Prompts.AxialCodingWithFeedbackPrompt.txt")
    );

    private readonly AxialCodeDbContext _dbContext;
    private readonly IMediator _mediator;
    private readonly IChatClientBuilder _chatClientBuilder;

    private static readonly JsonSerializerOptions LlmJsonOptions = new() { PropertyNameCaseInsensitive = true };

    public GenerateAxialCodingResultHandler(
        AxialCodeDbContext dbContext,
        IMediator mediator,
        IChatClientBuilder chatClientBuilder
    )
    {
        _dbContext = dbContext;
        _mediator = mediator;
        _chatClientBuilder = chatClientBuilder;
    }

    public async ValueTask<Result<GenerateAxialCodingResultResponse>> Handle(
        GenerateAxialCodingResultRequest request,
        CancellationToken cancellationToken
    )
    {
        // Get open codes (+ permission en version validation)
        var getOpenCodesResult = await _mediator.Send(
            new GetVersionOpencodeQuery
            {
                ProjectId = request.ProjectId,
                ProjectVersionId = request.ProjectVersionId,
                UserId = request.UserId,
            },
            cancellationToken
        );
        if (getOpenCodesResult.IsError)
        {
            return getOpenCodesResult.ErrorCode;
        }
        if (!getOpenCodesResult.Value.Opencodes.Any())
        {
            return ErrorCode.NoOpenCodes;
        }
        // LLM call -> create axial codes
        Result<IEnumerable<AxialCode>> axialCodeGenerationResult;
        if (string.IsNullOrWhiteSpace(request.Feedback) || request.AxialCodes == null || !request.AxialCodes.Any())
        {
            axialCodeGenerationResult = await GenerateAxialCodesAsync(
                request.UserId,
                getOpenCodesResult.Value.Opencodes,
                cancellationToken
            );
        }
        else
        {
            axialCodeGenerationResult = await GenerateAxialCodesAsync(
                request.UserId,
                getOpenCodesResult.Value.Opencodes,
                request.Feedback,
                request.AxialCodes,
                cancellationToken
            );
        }
        if (axialCodeGenerationResult.IsError)
        {
            return axialCodeGenerationResult.ErrorCode;
        }
        // Save axial codes to db as result
        var axialCodingResult = new AxialCodingResult
        {
            AxialCodingResultId = Guid.NewGuid(),
            ProjectVersionId = request.ProjectVersionId,
            IsActive = false,
            CreatedAt = DateTimeOffset.UtcNow,
            AxialCodes = axialCodeGenerationResult.Value,
        };
        int changes;
        try
        {
            _dbContext.AxialCodingResults.Add(axialCodingResult);
            changes = await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is DbUpdateException or DbException or InvalidOperationException)
        {
            Logger.Error(
                ex,
                "Error saving axial coding result for project version {ProjectVersionId}",
                request.ProjectVersionId
            );
            return ErrorCode.DatabaseError;
        }
        if (changes == 0)
        {
            Logger.Error(
                "Error saving axial coding result for project version {ProjectVersionId} (no changes)",
                request.ProjectVersionId
            );
            return ErrorCode.NoChanges;
        }
        //
        return new GenerateAxialCodingResultResponse
        {
            AxialCodingResultId = axialCodingResult.AxialCodingResultId,
            AxialCodes = axialCodingResult.AxialCodes.Select(ac => new AxialCodeViewModel
            {
                Label = ac.Label,
                Description = ac.Description,
                TraceIds = ac.TraceIds,
            }),
        };
    }

    // Axial coding
    private sealed record OpenCodeLlmItem
    {
        [JsonPropertyName("openCodeId")]
        public required int OpenCodeId { get; init; }

        [JsonPropertyName("openCode")]
        public required string? OpenCode { get; init; }
    }

    private sealed record AxialCodeLlmItem
    {
        [JsonPropertyName("label")]
        public required string Label { get; init; }

        [JsonPropertyName("description")]
        public required string Description { get; init; }

        [JsonPropertyName("openCodeIds")]
        public required ICollection<int> OpenCodeIds { get; init; }
    }

    private async Task<Result<IEnumerable<AxialCode>>> GenerateAxialCodesAsync(
        Guid userId,
        IEnumerable<GetVersionOpencodeResponse.OpencodeViewModel> opencodeViewModels,
        CancellationToken cancellationToken
    )
    {
        var mapping = BuildOpenCodeMapping(opencodeViewModels, out var openCodesPayload);
        var openCodesJson = JsonSerializer.Serialize(openCodesPayload);
        var messages = new List<ChatMessage>
        {
            new(ChatRole.System, _axialCodingPrompt.Value),
            new(ChatRole.User, openCodesJson),
        };
        var llmResult = await DoLlmCall(userId, messages, cancellationToken);
        if (llmResult.IsError)
        {
            return llmResult.ErrorCode;
        }
        return ParseAxialCodes(llmResult.Value, mapping);
    }

    private async Task<Result<IEnumerable<AxialCode>>> GenerateAxialCodesAsync(
        Guid userId,
        IEnumerable<GetVersionOpencodeResponse.OpencodeViewModel> opencodeViewModels,
        string feedback,
        IEnumerable<AxialCodeViewModel> previousAxialCodes,
        CancellationToken cancellationToken
    )
    {
        var mapping = BuildOpenCodeMapping(opencodeViewModels, out var openCodesPayload);
        var previousAxialCodesPayload = previousAxialCodes.Select(axial => new AxialCodeLlmItem
        {
            Label = axial.Label,
            Description = axial.Description,
            OpenCodeIds = axial
                .TraceIds.Select(id => mapping.FirstOrDefault(kvp => kvp.Value == id).Key)
                .Where(id => id > 0)
                .ToArray(),
        });
        var userPrompt = JsonSerializer.Serialize(
            new
            {
                openCodes = openCodesPayload,
                previousAxialCodes = previousAxialCodesPayload,
                feedback,
            }
        );
        var messages = new List<ChatMessage>
        {
            new(ChatRole.System, _axialCodingWithFeedbackPrompt.Value),
            new(ChatRole.User, userPrompt),
        };
        var llmResult = await DoLlmCall(userId, messages, cancellationToken);
        if (llmResult.IsError)
        {
            return llmResult.ErrorCode;
        }
        return ParseAxialCodes(llmResult.Value, mapping);
    }

    private static Dictionary<int, Guid> BuildOpenCodeMapping(
        IEnumerable<GetVersionOpencodeResponse.OpencodeViewModel> opencodeViewModels,
        out List<OpenCodeLlmItem> openCodesPayload
    )
    {
        openCodesPayload = [];
        var mapping = new Dictionary<int, Guid>();
        var index = 1;
        foreach (var openCode in opencodeViewModels)
        {
            mapping[index] = openCode.TraceId;
            openCodesPayload.Add(new OpenCodeLlmItem { OpenCodeId = index, OpenCode = openCode.OpenCode });
            index++;
        }
        return mapping;
    }

    private static Result<IEnumerable<AxialCode>> ParseAxialCodes(string llmResponse, Dictionary<int, Guid> mapping)
    {
        try
        {
            llmResponse = NormalizeLlmResponse(llmResponse);
            var deserializedResponse = JsonSerializer.Deserialize<IEnumerable<AxialCodeLlmItem>>(
                llmResponse,
                LlmJsonOptions
            );
            if (deserializedResponse == null)
            {
                throw new JsonException();
            }
            var axialCodes = new List<AxialCode>();
            foreach (var llmItem in deserializedResponse)
            {
                var mappedIds = llmItem
                    .OpenCodeIds.Select(id => mapping.GetValueOrDefault(id))
                    .Where(id => id != Guid.Empty)
                    .ToArray();
                if (mappedIds.Length == 0 && llmItem.OpenCodeIds.Count > 0)
                {
                    return ErrorCode.LlmError;
                }
                axialCodes.Add(
                    new AxialCode
                    {
                        AxialCodeId = Guid.NewGuid(),
                        Label = llmItem.Label,
                        Description = llmItem.Description,
                        TraceIds = mappedIds,
                        AxialCodingResultId = Guid.Empty,
                        AxialCodingResult = null,
                    }
                );
            }
            return Result.Success<IEnumerable<AxialCode>>(axialCodes);
        }
        catch (JsonException ex)
        {
            Logger.Error(
                ex,
                "Failed to deserialize LLM response into axial codes. Response: {LlmResponse}",
                llmResponse
            );
            return ErrorCode.LlmError;
        }
    }

    private static string NormalizeLlmResponse(string llmResponse)
    {
        var response = llmResponse.Trim();
        if (!response.StartsWith("```", StringComparison.Ordinal))
        {
            return response;
        }
        var firstLineEnd = response.IndexOf('\n');
        if (firstLineEnd < 0)
        {
            return response;
        }
        response = response[(firstLineEnd + 1)..].Trim();
        if (response.EndsWith("```", StringComparison.Ordinal))
        {
            response = response[..^3].Trim();
        }
        return response;
    }

    private async Task<Result<string>> DoLlmCall(
        Guid userId,
        List<ChatMessage> messages,
        CancellationToken cancellationToken
    )
    {
        var chatClientResult = await GetChatClientAsync(userId, cancellationToken);
        if (chatClientResult.IsError)
        {
            Logger.Error("Error getting AI chat client: {Error}", chatClientResult.ErrorCode);
            return chatClientResult.ErrorCode;
        }
        try
        {
            var result = await chatClientResult.Value.GetResponseAsync(messages, cancellationToken: cancellationToken);
            Logger.Information("Received response from AI chat client: {Response}", result);
            return result.Text;
        }
        catch (Exception ex)
        {
            Logger.Error(ex, "Error pinging AI chat client");
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

    // Utility
    private static string LoadPrompt(string resourceName)
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(resourceName);
        if (stream == null)
        {
            throw new InvalidOperationException($"Prompt resource not found: {resourceName}");
        }
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
