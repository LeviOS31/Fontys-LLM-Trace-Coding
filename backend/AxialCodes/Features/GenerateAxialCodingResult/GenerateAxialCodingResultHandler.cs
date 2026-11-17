using System.Data.Common;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
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
using Traces.Contracts.Features.GetTrace;
using Traces.Contracts.Features.GetVersionOpencode;

namespace AxialCodes.Features.GenerateAxialCodingResult;

public class GenerateAxialCodingResultHandler
    : IRequestHandler<GenerateAxialCodingResultRequest, Result<GenerateAxialCodingResultResponse>>
{
    private static readonly ILogger Logger = Log.ForContext<GenerateAxialCodingResultHandler>();

    private const string ExampleValidationPrompt =
        "You are checking whether a real assistant response exhibits a defined behavior.\n"
        + "Judge only the assistant response in the supplied trace against the guidelines. "
        + "Do not treat reviewer comments or open-code annotations as part of the trace, and do not require the assistant to mention or explain the behavior.\n"
        + "If the response does not clearly exhibit the behavior, return false. Also estimate matchScore from 0 to 100 for how closely the response exhibits it; use 0 when there is no evidence.\n"
        + "Return only JSON: {\"reasoning\":\"A short explanation citing the assistant response\",\"result\":true|false,\"matchScore\":0}.";

    private const int MaxExcerptChars = 500;          // stored and shown, per message
    private const int MaxJudgeChars = 3000;           // what the judge sees, per message
    private const int MaxJudgedReasoningChars = 800;  // leaves room for the fallback prefix under the 1000 column
    private const int MaxNegativeAttempts = 6;
    private const int ClearNegativeScore = 15;        // at or below this a negative is accepted immediately
    private const int MaxNegativeScore = 40;          // above this a "false" verdict is too borderline to show

    // The model is nondeterministic: a missing field or a paraphrased quote can succeed on a second try.
    private const int MaxGenerationAttempts = 2;


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
            return getOpenCodesResult.ErrorCode!;
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
                request.ProjectId,
                request.ProjectVersionId,
                getOpenCodesResult.Value.Opencodes,
                cancellationToken
            );
        }
        else
        {
            axialCodeGenerationResult = await GenerateAxialCodesAsync(
                request.UserId,
                request.ProjectId,
                request.ProjectVersionId,
                getOpenCodesResult.Value.Opencodes,
                request.Feedback,
                request.AxialCodes,
                cancellationToken
            );
        }
        if (axialCodeGenerationResult.IsError)
        {
            return axialCodeGenerationResult.ErrorCode!;
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
                Rationale = ac.Rationale,
                JudgeGuidelines = ac.JudgeGuidelines,
                PositiveExampleTrace = ac.PositiveExampleTrace,
                PositiveExampleReasoning = ac.PositiveExampleReasoning,
                NegativeExampleTrace = ac.NegativeExampleTrace,
                NegativeExampleReasoning = ac.NegativeExampleReasoning,
                OpenCodeJustifications = ac.OpenCodeJustifications.Select(j => new OpenCodeJustificationViewModel
                {
                    TraceId = j.TraceId,
                    Quote = j.Quote,
                    Justification = j.Justification,
                }),
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

        [JsonPropertyName("rationale")]
        public required string Rationale { get; init; }

        [JsonPropertyName("judgeGuidelines")]
        public required string JudgeGuidelines { get; init; }

        [JsonPropertyName("positiveExampleOpenCodeId")]
        public required int PositiveExampleOpenCodeId { get; init; }

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

        [JsonPropertyName("rationale")]
        public string? Rationale { get; init; }

        [JsonPropertyName("judgeGuidelines")]
        public string? JudgeGuidelines { get; init; }

        [JsonPropertyName("openCodeIds")]
        public required ICollection<int> OpenCodeIds { get; init; }
    }

    private sealed record AxialCodeEvidenceLlmItem
    {
        [JsonPropertyName("openCodeId")]
        public required int OpenCodeId { get; init; }

        [JsonPropertyName("quote")]
        public required string Quote { get; init; }

        [JsonPropertyName("justification")]
        public required string Justification { get; init; }
    }

    private sealed record AxialCodeVerificationResponse
    {
        [JsonPropertyName("checks")]
        public required ICollection<AxialCodeVerificationItem> Checks { get; init; }
    }

    private sealed record AxialCodeVerificationItem
    {
        [JsonPropertyName("index")] public required int Index { get; init; }
        [JsonPropertyName("supported")] public required bool Supported { get; init; }
        [JsonPropertyName("rationale")] public required string Rationale { get; init; }
    }

    // Trace: clipped "User: ...\nAssistant: ..." that is stored and shown.
    // JudgeInput: the (much less clipped) text the judge actually reads.
    private sealed record ExampleResult(string Trace, string Reasoning, string JudgeInput);

    private sealed record ExampleJudgment(ExampleResult Example, bool MatchesExpected, int MatchScore);

    private sealed record TraceMessage(string Role, string Content);

    private sealed record VerificationOutcome(HashSet<int> Supported, Dictionary<int, ExampleResult> Positives);

    private async Task<Result<IEnumerable<AxialCode>>> GenerateAxialCodesAsync(
        Guid userId,
        Guid projectId,
        Guid projectVersionId,
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
        return await GenerateAndValidateAxialCodesAsync(
            userId,
            projectId,
            projectVersionId,
            messages,
            mapping,
            openCodesPayload,
            cancellationToken
        );
    }

    private async Task<Result<IEnumerable<AxialCode>>> GenerateAxialCodesAsync(
        Guid userId,
        Guid projectId,
        Guid projectVersionId,
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
            Rationale = axial.Rationale,
            JudgeGuidelines = axial.JudgeGuidelines,
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
        return await GenerateAndValidateAxialCodesAsync(
            userId,
            projectId,
            projectVersionId,
            messages,
            mapping,
            openCodesPayload,
            cancellationToken
        );
    }

    private async Task<Result<IEnumerable<AxialCode>>> GenerateAndValidateAxialCodesAsync(
        Guid userId,
        Guid projectId,
        Guid projectVersionId,
        List<ChatMessage> messages,
        Dictionary<int, Guid> mapping,
        List<OpenCodeLlmItem> openCodesPayload,
        CancellationToken cancellationToken
    )
    {
        // Generate, parse and ground-check. Retry when the model output is malformed or ungrounded.
        List<AxialCodeLlmItem>? candidates = null;
        ErrorCode? lastError = null;
        for (var attempt = 1; attempt <= MaxGenerationAttempts; attempt++)
        {
            var llmResult = await DoLlmCall(userId, messages, cancellationToken);
            if (llmResult.IsError)
            {
                return llmResult.ErrorCode!;
            }

            var parsedResult = ParseAxialCodes(llmResult.Value);
            if (parsedResult.IsError)
            {
                lastError = parsedResult.ErrorCode;
                Logger.Warning(
                    "Axial code generation attempt {Attempt}/{Max} could not be parsed",
                    attempt,
                    MaxGenerationAttempts
                );
                continue;
            }

            var parsedCandidates = parsedResult.Value.ToList();
            var validationResult = ValidateGroundedAxialCodes(parsedCandidates, mapping, openCodesPayload);
            if (validationResult.IsError)
            {
                lastError = validationResult.ErrorCode;
                Logger.Warning(
                    "Axial code generation attempt {Attempt}/{Max} failed grounding validation",
                    attempt,
                    MaxGenerationAttempts
                );
                continue;
            }

            candidates = parsedCandidates;
            break;
        }

        if (candidates == null)
        {
            return lastError ?? ErrorCode.LlmError;
        }

        var verificationResult = await VerifyAxialCodesAsync(
    userId,
    candidates,
    openCodesPayload,
    cancellationToken
);
        if (verificationResult.IsError)
        {
            return verificationResult.ErrorCode!;
        }

        var supported = verificationResult.Value;
        if (supported.Count == 0)
        {
            Logger.Warning("Grounding verification rejected all generated axial codes");
            return ErrorCode.LlmError;
        }

        // Examples are only searched for codes that passed the audit.
        var traceCache = new Dictionary<Guid, IReadOnlyList<TraceMessage>?>();
        var positives = await FindPositiveExamplesAsync(
            userId,
            projectId,
            projectVersionId,
            candidates,
            supported,
            mapping,
            traceCache,
            cancellationToken
        );

        // Sequential on purpose: every LLM call reads the config through a scoped DbContext,
        // which does not allow concurrent use.
        var acceptedAxialCodes = new List<AxialCode>();
        foreach (var index in supported.OrderBy(i => i))
        {
            var candidate = candidates[index];
            var positive = positives.GetValueOrDefault(index);
            ExampleResult? negative = null;
            if (positive != null)
            {
                negative = await FindRealNegativeAsync(
                    userId,
                    projectId,
                    projectVersionId,
                    candidate,
                    positive,
                    openCodesPayload,
                    mapping,
                    traceCache,
                    cancellationToken
                );
            }
            acceptedAxialCodes.Add(BuildAxialCode(candidate, mapping, positive, negative));
        }

        return Result.Success<IEnumerable<AxialCode>>(acceptedAxialCodes);
    }

    private static AxialCode BuildAxialCode(
        AxialCodeLlmItem candidate,
        Dictionary<int, Guid> mapping,
        ExampleResult? positive,
        ExampleResult? negative
    )
    {
        var axialCodeId = Guid.NewGuid();
        return new AxialCode
        {
            AxialCodeId = axialCodeId,
            Label = candidate.Label.Trim(),
            Description = candidate.Description.Trim(),
            Rationale = candidate.Rationale.Trim(),
            JudgeGuidelines = candidate.JudgeGuidelines.Trim(),
            PositiveExampleTrace = positive?.Trace,
            PositiveExampleReasoning = positive?.Reasoning,
            NegativeExampleTrace = negative?.Trace,
            NegativeExampleReasoning = negative?.Reasoning,
            TraceIds = candidate.OpenCodeIds.Select(id => mapping[id]).Distinct().ToArray(),
            // Open codes are keyed by trace; keep one justification per open code.
            OpenCodeJustifications = candidate
                .Evidence.Select(evidence => new AxialCodeOpenCodeJustification
                {
                    AxialCodeId = axialCodeId,
                    TraceId = mapping[evidence.OpenCodeId],
                    Quote = evidence.Quote.Trim(),
                    Justification = evidence.Justification.Trim(),
                })
                .DistinctBy(justification => justification.TraceId)
                .ToList(),
            AxialCodingResultId = Guid.Empty,
            AxialCodingResult = null,
        };
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
        var openCodeText = openCodes.ToDictionary(code => code.OpenCodeId, code => NormalizeForMatch(code.OpenCode));

        foreach (var axialCode in axialCodes)
        {
            if (axialCode == null)
            {
                return ErrorCode.LlmError;
            }

            if (
                string.IsNullOrWhiteSpace(axialCode.Label)
                || string.IsNullOrWhiteSpace(axialCode.Description)
                || string.IsNullOrWhiteSpace(axialCode.Rationale)
                || string.IsNullOrWhiteSpace(axialCode.JudgeGuidelines)
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

            if (!axialCode.OpenCodeIds.Contains(axialCode.PositiveExampleOpenCodeId))
            {
                Logger.Warning("Generated axial code picked a positive example that is not one of its open codes");
                return ErrorCode.LlmError;
            }

            var evidenceById = new Dictionary<int, string>();
            foreach (var evidence in axialCode.Evidence)
            {
                if (
                    evidence == null
                    || !axialCode.OpenCodeIds.Contains(evidence.OpenCodeId)
                    || string.IsNullOrWhiteSpace(evidence.Quote)
                    || string.IsNullOrWhiteSpace(evidence.Justification)
                    || !evidenceById.TryAdd(evidence.OpenCodeId, evidence.Quote)
                )
                {
                    return ErrorCode.LlmError;
                }

                var normalizedQuote = NormalizeForMatch(evidence.Quote);
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
    IReadOnlyList<AxialCodeLlmItem> axialCodes,
    List<OpenCodeLlmItem> openCodes,
    CancellationToken cancellationToken
)
    {
        var candidates = axialCodes
            .Select(
                (code, index) =>
                    new
                    {
                        index,
                        label = code.Label,
                        description = code.Description,
                        rationale = code.Rationale,
                        judgeGuidelines = code.JudgeGuidelines,
                        openCodeIds = code.OpenCodeIds,
                        evidence = code.Evidence,
                    }
            )
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
            return llmResult.ErrorCode!;
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

            return checks.Where(check => check.Supported).Select(check => check.Index).ToHashSet();
        }
        catch (JsonException ex)
        {
            Logger.Error(ex, "Failed to parse axial-code grounding verification response");
            return ErrorCode.LlmError;
        }
    }

    // For each supported code: the nominated open code's trace first, then the other traces in the code.
    // The first trace the judge confirms wins; otherwise the closest-scoring one is kept as best available.
    private async Task<Dictionary<int, ExampleResult>> FindPositiveExamplesAsync(
        Guid userId,
        Guid projectId,
        Guid projectVersionId,
        IReadOnlyList<AxialCodeLlmItem> axialCodes,
        HashSet<int> indices,
        Dictionary<int, Guid> mapping,
        Dictionary<Guid, IReadOnlyList<TraceMessage>?> traceCache,
        CancellationToken cancellationToken
    )
    {
        var positives = new Dictionary<int, ExampleResult>();
        foreach (var index in indices.OrderBy(i => i))
        {
            var code = axialCodes[index];
            ExampleResult? closestAvailable = null;
            var closestMatchScore = -1;
            var candidateIds = new[] { code.PositiveExampleOpenCodeId }
                .Concat(code.OpenCodeIds.Where(id => id != code.PositiveExampleOpenCodeId))
                .Distinct();

            foreach (var id in candidateIds)
            {
                var traceMessages = await LoadTraceMessagesCachedAsync(
                    traceCache,
                    userId,
                    projectId,
                    projectVersionId,
                    mapping[id],
                    cancellationToken
                );
                if (traceMessages == null)
                {
                    continue;
                }

                var built = BuildExcerptExample(traceMessages);
                if (built == null)
                {
                    continue;
                }

                var judged = await JudgeExampleAsync(userId, code, built, expectedResult: true, cancellationToken);
                if (judged?.MatchesExpected == true)
                {
                    positives[index] = judged.Example;
                    closestAvailable = null;
                    break;
                }

                if (judged != null && judged.MatchScore > closestMatchScore)
                {
                    closestMatchScore = judged.MatchScore;
                    closestAvailable = judged.Example with
                    {
                        Reasoning =
                            $"This is the closest available real trace for the category, although it does not clearly demonstrate the behavior: {judged.Example.Reasoning}",
                    };
                }
                else if (judged == null && closestAvailable == null)
                {
                    closestAvailable = built with
                    {
                        Reasoning =
                            "This is the nominated real trace for the category; its behavior could not be confirmed against the judging guidelines.",
                    };
                }
            }

            if (!positives.ContainsKey(index) && closestAvailable != null)
            {
                positives[index] = closestAvailable;
            }
        }

        return positives;
    }

    // Finds a real trace that does not exhibit the behaviour. Nothing is generated. Candidates are
    // open-coded traces outside this axial code, ranked by overlap with the code's label, description
    // and its "Mark false when" near miss. The judge must say false; a clearly low match score is
    // accepted immediately, otherwise the lowest-scoring false verdict among the candidates is used.
    private async Task<ExampleResult?> FindRealNegativeAsync(
        Guid userId,
        Guid projectId,
        Guid projectVersionId,
        AxialCodeLlmItem candidate,
        ExampleResult positive,
        List<OpenCodeLlmItem> openCodes,
        Dictionary<int, Guid> mapping,
        Dictionary<Guid, IReadOnlyList<TraceMessage>?> traceCache,
        CancellationToken cancellationToken
    )
    {
        static HashSet<string> Tokens(string? text) =>
            Regex
                .Split((text ?? string.Empty).ToLowerInvariant(), @"[^\p{L}\p{N}]+")
                .Where(token => token.Length > 2)
                .ToHashSet();

        static double Jaccard(HashSet<string> a, HashSet<string> b) =>
            a.Count == 0 || b.Count == 0 ? 0 : (double)a.Intersect(b).Count() / a.Union(b).Count();

        var nearMiss =
            candidate
                .JudgeGuidelines.Split('\n')
                .FirstOrDefault(line =>
                    line.TrimStart().StartsWith("Mark false when:", StringComparison.OrdinalIgnoreCase)
                ) ?? string.Empty;

        var own = candidate.OpenCodeIds.ToHashSet();
        var topic = Tokens($"{candidate.Label} {candidate.Description}");
        var nearMissTokens = Tokens(nearMiss);

        var pool = openCodes
            .Where(code => !own.Contains(code.OpenCodeId) && !string.IsNullOrWhiteSpace(code.OpenCode))
            .Select(code =>
            {
                var tokens = Tokens(code.OpenCode);
                return (code, score: Jaccard(topic, tokens) + Jaccard(nearMissTokens, tokens));
            })
            .OrderByDescending(item => item.score)
            .ThenBy(item => item.code.OpenCodeId)
            .Take(MaxNegativeAttempts)
            .Select(item => item.code)
            .ToList();

        ExampleJudgment? best = null;
        foreach (var other in pool)
        {
            var messages = await LoadTraceMessagesCachedAsync(
                traceCache,
                userId,
                projectId,
                projectVersionId,
                mapping[other.OpenCodeId],
                cancellationToken
            );
            if (messages == null)
            {
                continue;
            }

            var excerpt = BuildExcerptExample(messages);
            if (excerpt == null || NormalizeForMatch(excerpt.Trace) == NormalizeForMatch(positive.Trace))
            {
                continue;
            }

            var judged = await JudgeExampleAsync(userId, candidate, excerpt, expectedResult: false, cancellationToken);
            if (judged?.MatchesExpected != true || judged.MatchScore > MaxNegativeScore)
            {
                continue;
            }

            if (judged.MatchScore <= ClearNegativeScore)
            {
                return judged.Example;
            }

            if (best == null || judged.MatchScore < best.MatchScore)
            {
                best = judged;
            }
        }

        if (best == null)
        {
            Logger.Information("No real negative example found for axial code {Label}", candidate.Label);
        }
        return best?.Example;
    }

    // Trace loading
    private async Task<IReadOnlyList<TraceMessage>?> LoadTraceMessagesAsync(
        Guid userId,
        Guid projectId,
        Guid projectVersionId,
        Guid traceId,
        CancellationToken cancellationToken
    )
    {
        var result = await _mediator.Send(
            new GetTraceQuery
            {
                ProjectId = projectId,
                ProjectVersionId = projectVersionId,
                UserId = userId,
                TraceId = traceId,
            },
            cancellationToken
        );
        if (result.IsError)
        {
            Logger.Warning("Could not load trace {TraceId}: {Error}", traceId, result.ErrorCode);
            return null;
        }

        var spans = GetSpanAttributes(result.Value).ToList();

        // Later LLM spans repeat the earlier conversation, so use only the last span with an output.
        var llmSpans = spans
            .Where(s => s.ContainsKey("gen_ai.completion.0.content") || s.ContainsKey("gen_ai.output.messages"))
            .ToList();
        var messages = ExtractMessages(llmSpans.Count > 0 ? llmSpans.TakeLast(1) : spans);

        if (messages.Count == 0)
        {
            Logger.Warning(
                "No gen_ai prompt/completion messages found in trace {TraceId}. Attribute keys: {Keys}",
                traceId,
                spans.SelectMany(s => s.Keys).Distinct().Take(30)
            );
            return null;
        }
        return messages;
    }

    private async Task<IReadOnlyList<TraceMessage>?> LoadTraceMessagesCachedAsync(
    Dictionary<Guid, IReadOnlyList<TraceMessage>?> cache,
    Guid userId,
    Guid projectId,
    Guid projectVersionId,
    Guid traceId,
    CancellationToken cancellationToken
)
    {
        if (cache.TryGetValue(traceId, out var cached))
        {
            return cached;
        }

        var loaded = await LoadTraceMessagesAsync(userId, projectId, projectVersionId, traceId, cancellationToken);
        cache[traceId] = loaded;
        return loaded;
    }

    // Reads canonical OpenTelemetry GenAI messages and the older indexed prompt/completion attributes.
    private static List<TraceMessage> ExtractMessages(IEnumerable<IReadOnlyDictionary<string, string>> spans)
    {
        var messages = new List<TraceMessage>();
        foreach (var attributes in spans)
        {
            if (attributes.ContainsKey("gen_ai.input.messages") || attributes.ContainsKey("gen_ai.output.messages"))
            {
                AddOtelMessages(attributes.GetValueOrDefault("gen_ai.input.messages"), "user", messages);
                AddOtelMessages(attributes.GetValueOrDefault("gen_ai.output.messages"), "assistant", messages);
                continue;
            }

            foreach (var prefix in new[] { "gen_ai.prompt", "gen_ai.completion" })
            {
                var defaultRole = prefix == "gen_ai.completion" ? "assistant" : "user";
                for (var i = 0; attributes.ContainsKey($"{prefix}.{i}.content"); i++)
                {
                    var role = attributes.GetValueOrDefault($"{prefix}.{i}.role") ?? defaultRole;
                    messages.Add(new TraceMessage(role, attributes[$"{prefix}.{i}.content"]));
                }
            }
        }
        return messages;
    }

    private static void AddOtelMessages(string? json, string defaultRole, ICollection<TraceMessage> messages)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return;
        }

        try
        {
            using var document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                Logger.Warning("OpenTelemetry GenAI messages attribute was not a JSON array");
                return;
            }

            foreach (var message in document.RootElement.EnumerateArray())
            {
                if (message.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                var role =
                    message.TryGetProperty("role", out var roleElement)
                    && roleElement.ValueKind == JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(roleElement.GetString())
                        ? roleElement.GetString()!.Trim()
                        : defaultRole;
                var content = GetOtelTextContent(message);
                if (!string.IsNullOrWhiteSpace(content))
                {
                    messages.Add(new TraceMessage(role, content));
                }
            }
        }
        catch (JsonException ex)
        {
            Logger.Warning(ex, "Could not parse OpenTelemetry GenAI messages attribute");
        }
    }

    private static string GetOtelTextContent(JsonElement message)
    {
        if (!message.TryGetProperty("parts", out var parts) || parts.ValueKind != JsonValueKind.Array)
        {
            return message.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.String
                ? content.GetString() ?? string.Empty
                : string.Empty;
        }

        return string.Concat(
            parts.EnumerateArray()
                .Where(part =>
                    part.ValueKind == JsonValueKind.Object
                    && part.TryGetProperty("type", out var type)
                    && type.ValueKind == JsonValueKind.String
                    && type.GetString() == "text"
                    && part.TryGetProperty("content", out var partContent)
                    && partContent.ValueKind == JsonValueKind.String
                )
                .Select(part => part.GetProperty("content").GetString())
        );
    }

    private static IEnumerable<IReadOnlyDictionary<string, string>> GetSpanAttributes(GetTraceResponse trace) =>
        trace
            .TraceScopes.SelectMany(scope => scope.Spans)
            .OrderBy(span => span.StartTimeUnixNano)
            .Select(span =>
            {
                var attributes = new Dictionary<string, string>();
                foreach (var attribute in span.Attributes)
                {
                    attributes[attribute.Key] = attribute.Value?.ToString() ?? string.Empty;
                }
                return (IReadOnlyDictionary<string, string>)attributes;
            });

    // The example contains only real trace messages (last user and assistant message, clipped).
    // Keeps the start and the end of a long message: the start shows the formatting and tone,
    // the end is where sources, closing questions and sign-offs live.
    private static string Clip(string text, int max)
    {
        text = text.Trim();
        if (text.Length <= max)
        {
            return text;
        }

        const string marker = " […] ";
        var keep = max - marker.Length;
        var head = keep * 2 / 3;
        var tail = keep - head;
        return text[..head].TrimEnd() + marker + text[^tail..].TrimStart();
    }

    private static string Truncate(string text, int max) =>
        text.Length <= max ? text : text[..(max - 1)].TrimEnd() + "…";

    // The example contains only real trace messages (last user and assistant message).
    private static ExampleResult? BuildExcerptExample(IReadOnlyList<TraceMessage> messages)
    {
        var user = messages.LastOrDefault(m => m.Role == "user")?.Content;
        var assistant = messages.LastOrDefault(m => m.Role == "assistant")?.Content;
        if (string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(assistant))
        {
            return null;
        }

        return new ExampleResult(
            $"User: {Clip(user, MaxExcerptChars)}\nAssistant: {Clip(assistant, MaxExcerptChars)}",
            string.Empty,
            $"User: {Clip(user, MaxJudgeChars)}\nAssistant: {Clip(assistant, MaxJudgeChars)}"
        );
    }

    // Classifies an existing real trace against the guidelines. It writes no example text itself;
    // only the short reasoning for the verdict comes from the model.
    private async Task<ExampleJudgment?> JudgeExampleAsync(
        Guid userId,
        AxialCodeLlmItem candidate,
        ExampleResult example,
        bool expectedResult,
        CancellationToken cancellationToken
    )
    {
        var system =
            $"{ExampleValidationPrompt}\n\nBehavior: {candidate.Label}\n\nJudging guidelines:\n{candidate.JudgeGuidelines}";

        var result = await DoLlmCall(
            userId,
            [new(ChatRole.System, system), new(ChatRole.User, example.JudgeInput)],
            cancellationToken
        );
        if (result.IsError)
        {
            Logger.Warning(
                "Could not verify {ExampleType} example for axial code {Label}",
                expectedResult ? "positive" : "negative",
                candidate.Label
            );
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(NormalizeLlmResponse(result.Value));
            var root = doc.RootElement;
            var hasVerdict =
                root.TryGetProperty("result", out var verdict)
                && (verdict.ValueKind == JsonValueKind.True || verdict.ValueKind == JsonValueKind.False);
            var reasoning =
                root.TryGetProperty("reasoning", out var reasoningValue)
                && reasoningValue.ValueKind == JsonValueKind.String
                    ? reasoningValue.GetString()?.Trim()
                    : null;
            var matchScore =
                root.TryGetProperty("matchScore", out var matchScoreValue)
                && matchScoreValue.TryGetInt32(out var score)
                && score is >= 0 and <= 100
                    ? score
                    : 0;
            if (!hasVerdict || string.IsNullOrWhiteSpace(reasoning))
            {
                Logger.Warning(
                    "Could not validate {ExampleType} example for axial code {Label}",
                    expectedResult ? "positive" : "negative",
                    candidate.Label
                );
                return null;
            }

            return new ExampleJudgment(
                example with { Reasoning = Truncate(reasoning, MaxJudgedReasoningChars) },
                verdict.GetBoolean() == expectedResult,
                matchScore
            );
        }
        catch (JsonException ex)
        {
            Logger.Warning(ex, "Could not parse example judgment for axial code {Label}", candidate.Label);
            return null;
        }
    }

    private static string NormalizeForMatch(string? text)
    {
        var normalized = (text ?? string.Empty)
            .Replace('\u2018', '\'') // ‘
            .Replace('\u2019', '\'') // ’
            .Replace('\u02BC', '\'') // ʼ
            .Replace('`', '\'')
            .Replace('\u201C', '"') // “
            .Replace('\u201D', '"'); // ”

        return string.Join(' ', normalized.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
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
            return chatClientResult.ErrorCode!;
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
            return llmConfigResult.ErrorCode!;
        }
        return _chatClientBuilder
            .WithProvider(llmConfigResult.Value.ProviderName)
            .WithEndpoint(llmConfigResult.Value.Endpoint)
            .WithModel(llmConfigResult.Value.ModelName)
            .WithApiKey(llmConfigResult.Value.ApiKey)
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