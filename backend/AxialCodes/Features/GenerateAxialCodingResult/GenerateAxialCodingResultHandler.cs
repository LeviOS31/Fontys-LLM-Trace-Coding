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
    private static readonly Lazy<string> _axialCodingVerificationPrompt = new(() =>
        LoadPrompt("AxialCodes.Resources.Prompts.AxialCodingVerificationPrompt.txt")
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

        [JsonPropertyName("evidence")]
        public required ICollection<AxialCodeEvidenceLlmItem> Evidence { get; init; }
    }

    private sealed record PreviousAxialCodeLlmItem
    {
        [JsonPropertyName("label")]
        public required string Label { get; init; }

        [JsonPropertyName("description")]
        public required string Description { get; init; }

        [JsonPropertyName("openCodeIds")]
        public required ICollection<int> OpenCodeIds { get; init; }
    }

    private sealed record AxialCodeEvidenceLlmItem
    {
        [JsonPropertyName("openCodeId")]
        public required int OpenCodeId { get; init; }

        [JsonPropertyName("quote")]
        public required string Quote { get; init; }
    }

    private sealed record AxialCodeVerificationResponse
    {
        [JsonPropertyName("checks")]
        public required ICollection<AxialCodeVerificationItem> Checks { get; init; }
    }

    private sealed record AxialCodeVerificationItem
    {
        [JsonPropertyName("index")]
        public required int Index { get; init; }

        [JsonPropertyName("supported")]
        public required bool Supported { get; init; }

        [JsonPropertyName("rationale")]
        public required string Rationale { get; init; }
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
        return await GenerateAndValidateAxialCodesAsync(userId, messages, mapping, openCodesPayload, cancellationToken);
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
        var previousAxialCodesPayload = previousAxialCodes.Select(axial => new PreviousAxialCodeLlmItem
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
        return await GenerateAndValidateAxialCodesAsync(userId, messages, mapping, openCodesPayload, cancellationToken);
    }

    private async Task<Result<IEnumerable<AxialCode>>> GenerateAndValidateAxialCodesAsync(
        Guid userId,
        List<ChatMessage> messages,
        Dictionary<int, Guid> mapping,
        List<OpenCodeLlmItem> openCodesPayload,
        CancellationToken cancellationToken
    )
    {
        var llmResult = await DoLlmCall(userId, messages, cancellationToken);
        if (llmResult.IsError)
        {
            return llmResult.ErrorCode;
        }

        var parsedResult = ParseAxialCodes(llmResult.Value);
        if (parsedResult.IsError)
        {
            return parsedResult.ErrorCode;
        }

        var candidates = parsedResult.Value.ToList();
        var validationResult = ValidateGroundedAxialCodes(candidates, mapping, openCodesPayload);
        if (validationResult.IsError)
        {
            return validationResult.ErrorCode;
        }

        var verificationResult = await VerifyAxialCodesAsync(
            userId,
            candidates,
            openCodesPayload,
            cancellationToken
        );
        if (verificationResult.IsError)
        {
            return verificationResult.ErrorCode;
        }

        var acceptedAxialCodes = candidates
            .Select((candidate, index) => (candidate, index))
            .Where(item => verificationResult.Value.Contains(item.index))
            .Select(item => new AxialCode
            {
                AxialCodeId = Guid.NewGuid(),
                Label = item.candidate.Label.Trim(),
                Description = item.candidate.Description.Trim(),
                TraceIds = item.candidate.OpenCodeIds.Select(id => mapping[id]).Distinct().ToArray(),
                AxialCodingResultId = Guid.Empty,
                AxialCodingResult = null,
            })
            .ToArray();

        if (acceptedAxialCodes.Length == 0)
        {
            Logger.Warning("Grounding verification rejected all generated axial codes");
            return ErrorCode.LlmError;
        }

        return Result.Success<IEnumerable<AxialCode>>(acceptedAxialCodes);
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

    private static Result<IEnumerable<AxialCodeLlmItem>> ParseAxialCodes(string llmResponse)
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
            var axialCodeItems = deserializedResponse.ToArray();
            if (axialCodeItems.Any(item => item == null))
            {
                throw new JsonException("Axial-code response contains a null item");
            }
            return Result.Success<IEnumerable<AxialCodeLlmItem>>(axialCodeItems);
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

    private static Result<bool> ValidateGroundedAxialCodes(
        IEnumerable<AxialCodeLlmItem> axialCodes,
        Dictionary<int, Guid> mapping,
        IEnumerable<OpenCodeLlmItem> openCodes
    )
    {
        var openCodeText = openCodes.ToDictionary(code => code.OpenCodeId, code => NormalizeWhitespace(code.OpenCode));

        foreach (var axialCode in axialCodes)
        {
            if (axialCode == null)
            {
                return ErrorCode.LlmError;
            }

            if (
                string.IsNullOrWhiteSpace(axialCode.Label)
                || string.IsNullOrWhiteSpace(axialCode.Description)
                || axialCode.Label.Length > AxialCode.MaxLabelLength
                || axialCode.Description.Length > AxialCode.MaxDescriptionLength
                || axialCode.OpenCodeIds == null
                || axialCode.Evidence == null
                || axialCode.OpenCodeIds.Count == 0
                || axialCode.Evidence.Count == 0
            )
            {
                return ErrorCode.LlmError;
            }

            if (axialCode.OpenCodeIds.Any(id => !mapping.ContainsKey(id)))
            {
                Logger.Warning("Generated axial code referenced one or more unknown open-code IDs");
                return ErrorCode.LlmError;
            }

            var evidenceById = new Dictionary<int, string>();
            foreach (var evidence in axialCode.Evidence)
            {
                if (
                    evidence == null
                    || !axialCode.OpenCodeIds.Contains(evidence.OpenCodeId)
                    || string.IsNullOrWhiteSpace(evidence.Quote)
                    || !evidenceById.TryAdd(evidence.OpenCodeId, evidence.Quote)
                )
                {
                    return ErrorCode.LlmError;
                }

                var normalizedQuote = NormalizeWhitespace(evidence.Quote);
                var normalizedOpenCode = openCodeText.GetValueOrDefault(evidence.OpenCodeId);
                if (
                    string.IsNullOrWhiteSpace(normalizedOpenCode)
                    || !normalizedOpenCode.Contains(normalizedQuote, StringComparison.Ordinal)
                )
                {
                    Logger.Warning(
                        "Generated axial code included evidence not found in its cited open code {OpenCodeId}",
                        evidence.OpenCodeId
                    );
                    return ErrorCode.LlmError;
                }
            }

            if (axialCode.OpenCodeIds.Distinct().Count() != axialCode.OpenCodeIds.Count)
            {
                return ErrorCode.LlmError;
            }

            if (axialCode.OpenCodeIds.Any(id => !evidenceById.ContainsKey(id)))
            {
                Logger.Warning("Generated axial code did not provide evidence for every cited open code");
                return ErrorCode.LlmError;
            }
        }

        return Result.Success(true);
    }

    private async Task<Result<HashSet<int>>> VerifyAxialCodesAsync(
        Guid userId,
        IEnumerable<AxialCodeLlmItem> axialCodes,
        List<OpenCodeLlmItem> openCodes,
        CancellationToken cancellationToken
    )
    {
        var candidates = axialCodes
            .Select((code, index) => new
            {
                index,
                label = code.Label,
                description = code.Description,
                openCodeIds = code.OpenCodeIds,
                evidence = code.Evidence,
            })
            .ToArray();
        var input = JsonSerializer.Serialize(new { openCodes, axialCodes = candidates });
        var messages = new List<ChatMessage>
        {
            new(ChatRole.System, _axialCodingVerificationPrompt.Value),
            new(ChatRole.User, input),
        };
        var llmResult = await DoLlmCall(userId, messages, cancellationToken);
        if (llmResult.IsError)
        {
            return llmResult.ErrorCode;
        }

        try
        {
            var response = JsonSerializer.Deserialize<AxialCodeVerificationResponse>(
                NormalizeLlmResponse(llmResult.Value),
                LlmJsonOptions
            );
            if (response?.Checks == null)
            {
                throw new JsonException("Verification response did not include checks");
            }

            var checks = response.Checks.ToArray();
            if (
                checks.Length != candidates.Length
                || checks.Any(check => check == null)
                || checks.Select(check => check.Index).Distinct().Count() != candidates.Length
                || checks.Any(check => check.Index < 0 || check.Index >= candidates.Length)
            )
            {
                throw new JsonException("Verification response did not contain exactly one check per axial code");
            }

            return Result.Success<HashSet<int>>(
                checks.Where(check => check.Supported).Select(check => check.Index).ToHashSet()
            );
        }
        catch (JsonException ex)
        {
            Logger.Error(ex, "Failed to parse axial-code grounding verification response");
            return ErrorCode.LlmError;
        }
    }

    private static string NormalizeWhitespace(string? text) =>
        string.Join(' ', (text ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));


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
