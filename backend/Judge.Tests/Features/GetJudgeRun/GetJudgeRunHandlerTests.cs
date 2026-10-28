using System.Text.Json;
using Judge.Data;
using Judge.Data.Models;
using Judge.Features.GetJudgeRun;
using Judge.Features.JudgeTracesForAxialCode;
using Microsoft.EntityFrameworkCore;
using Shared;
using Shouldly;

namespace Judge.Tests.Features.GetJudgeRun;

public class GetJudgeRunHandlerTests
{
    private static readonly Guid _projectId = new("68DF6625-60EA-4E0A-8F29-29DE14197024");
    private static readonly Guid _projectVersionId = new("68DF6625-60EA-4E0A-8F29-29DE14197025");
    private static readonly Guid _judgeRunId = new("68DF6625-60EA-4E0A-8F29-29DE14197026");
    private static readonly Guid _userId = new("CE97539F-4189-44FC-A87F-CFA3EDB177ED");

    private static DbContextOptions<JudgeDbContext> CreateOptions() =>
        new DbContextOptionsBuilder<JudgeDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

    private static GetJudgeRunRequest CreateRequest() =>
        new()
        {
            ProjectId = _projectId,
            ProjectVersionId = _projectVersionId,
            JudgeRunId = _judgeRunId,
            UserId = _userId,
        };

    private static JudgeRun CreateRun(string resultsJson, Guid? projectId = null, Guid? projectVersionId = null) =>
        new()
        {
            JudgeRunId = _judgeRunId,
            ProjectId = projectId ?? _projectId,
            ProjectVersionId = projectVersionId ?? _projectVersionId,
            ResultsJson = resultsJson,
            CreatedAt = DateTimeOffset.UtcNow,
            TotalCount = 0,
            TrueCount = 0,
            FalseCount = 0,
            FailedCount = 0,
        };

    private static async Task<JudgeDbContext> CreateContextWith(JudgeRun run)
    {
        var context = new JudgeDbContext(CreateOptions());
        context.JudgeRuns.Add(run);
        await context.SaveChangesAsync();
        return context;
    }

    [Fact]
    public async Task WhenRunExists_ReturnRunIdAndResults()
    {
        // Arrange
        var traceId = Guid.NewGuid();
        var json = JsonSerializer.Serialize(
            new List<TraceJudgeResultViewModel>
            {
                new()
                {
                    JudgeTemplateId = Guid.NewGuid(),
                    TraceId = traceId,
                    Status = "Success",
                    Verdict = "True",
                    Reasoning = "Because.",
                    Error = null,
                },
            }
        );
        await using var context = await CreateContextWith(CreateRun(json));
        var handler = new GetJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeRunId.ShouldBe(_judgeRunId);
        var item = result.Value.Results.Single();
        item.TraceId.ShouldBe(traceId);
        item.Status.ShouldBe("Success");
        item.Verdict.ShouldBe("True");
        item.Reasoning.ShouldBe("Because.");
        item.Error.ShouldBeNull();
    }

    [Fact]
    public async Task WhenRunHasErroredTrace_ReturnNullVerdictAndReasoning()
    {
        // Arrange
        var json = JsonSerializer.Serialize(
            new List<TraceJudgeResultViewModel>
            {
                new()
                {
                    JudgeTemplateId = Guid.NewGuid(),
                    TraceId = Guid.NewGuid(),
                    Status = "Error",
                    Verdict = null,
                    Reasoning = null,
                    Error = "LlmError",
                },
            }
        );
        await using var context = await CreateContextWith(CreateRun(json));
        var handler = new GetJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var item = result.Value!.Results.Single();
        item.Status.ShouldBe("Error");
        item.Verdict.ShouldBeNull();
        item.Reasoning.ShouldBeNull();
        item.Error.ShouldBe("LlmError");
    }

    [Fact]
    public async Task WhenResultsJsonIsEmptyArray_ReturnEmptyResults()
    {
        // Arrange
        await using var context = await CreateContextWith(CreateRun("[]"));
        var handler = new GetJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.Results.ShouldBeEmpty();
    }

    [Fact]
    public async Task WhenResultsJsonIsNull_ReturnEmptyResults()
    {
        // Arrange
        await using var context = await CreateContextWith(CreateRun("null"));
        var handler = new GetJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.Results.ShouldBeEmpty();
    }

    [Fact]
    public async Task WhenRunDoesNotExist_ReturnEntityNotFound()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var handler = new GetJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenRunBelongsToOtherProject_ReturnEntityNotFound()
    {
        // Arrange
        await using var context = await CreateContextWith(CreateRun("[]", projectId: Guid.NewGuid()));
        var handler = new GetJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenRunBelongsToOtherVersion_ReturnEntityNotFound()
    {
        // Arrange
        await using var context = await CreateContextWith(CreateRun("[]", projectVersionId: Guid.NewGuid()));
        var handler = new GetJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenResultsJsonIsCorrupt_ReturnDatabaseError()
    {
        // Arrange
        await using var context = await CreateContextWith(CreateRun("{ this is not valid json"));
        var handler = new GetJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenContextIsDisposed_ReturnDatabaseError()
    {
        // Arrange
        var context = new JudgeDbContext(CreateOptions());
        await context.DisposeAsync();
        var handler = new GetJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }
}