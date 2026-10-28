using Judge.Data;
using Judge.Data.Models;
using Judge.Features.ListJudgeRuns;
using Microsoft.EntityFrameworkCore;
using Shared;
using Shouldly;

namespace Judge.Tests.Features.ListJudgeRuns;

public class ListJudgeRunsHandlerTests
{
    private static readonly Guid _projectId = new("68DF6625-60EA-4E0A-8F29-29DE14197024");
    private static readonly Guid _projectVersionId = new("68DF6625-60EA-4E0A-8F29-29DE14197025");
    private static readonly Guid _userId = new("CE97539F-4189-44FC-A87F-CFA3EDB177ED");
    private static readonly DateTimeOffset _baseTime = new(2026, 10, 1, 12, 0, 0, TimeSpan.Zero);

    private static DbContextOptions<JudgeDbContext> CreateOptions() =>
        new DbContextOptionsBuilder<JudgeDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

    private static ListJudgeRunsRequest CreateRequest(int limit = 20, int offset = 0) =>
        new()
        {
            ProjectId = _projectId,
            ProjectVersionId = _projectVersionId,
            UserId = _userId,
            Limit = limit,
            Offset = offset,
        };

    private static JudgeRun CreateRun(
        DateTimeOffset? createdAt = null,
        Guid? judgeRunId = null,
        Guid? projectId = null,
        Guid? projectVersionId = null,
        Guid? axialCodeId = null,
        int total = 0,
        int trueCount = 0,
        int falseCount = 0,
        int failed = 0
    ) =>
        new()
        {
            JudgeRunId = judgeRunId ?? Guid.NewGuid(),
            ProjectId = projectId ?? _projectId,
            ProjectVersionId = projectVersionId ?? _projectVersionId,
            ResultsJson = "[]",
            CreatedAt = createdAt ?? _baseTime,
            TotalCount = total,
            TrueCount = trueCount,
            FalseCount = falseCount,
            FailedCount = failed,
        };

    private static async Task<JudgeDbContext> CreateContextWith(params JudgeRun[] runs)
    {
        var context = new JudgeDbContext(CreateOptions());
        context.JudgeRuns.AddRange(runs);
        await context.SaveChangesAsync();
        return context;
    }

    [Fact]
    public async Task WhenNoRunsExist_ReturnEmptyListAndZeroTotals()
    {
        // Arrange
        await using var context = await CreateContextWith();
        var handler = new ListJudgeRunsHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeRuns.ShouldBeEmpty();
        result.Value.Totals.Runs.ShouldBe(0);
        result.Value.Totals.TotalCount.ShouldBe(0);
        result.Value.Totals.TrueCount.ShouldBe(0);
        result.Value.Totals.FalseCount.ShouldBe(0);
        result.Value.Totals.FailedCount.ShouldBe(0);
    }

    [Fact]
    public async Task WhenRunExists_ReturnSummaryWithCounts()
    {
        // Arrange
        var runId = Guid.NewGuid();
        var axialCodeId = Guid.NewGuid();
        await using var context = await CreateContextWith(
            CreateRun(judgeRunId: runId, axialCodeId: axialCodeId, total: 5, trueCount: 2, falseCount: 2, failed: 1)
        );
        var handler = new ListJudgeRunsHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var run = result.Value!.JudgeRuns.Single();
        run.JudgeRunId.ShouldBe(runId);
        run.CreatedAt.ShouldBe(_baseTime);
        run.TotalCount.ShouldBe(5);
        run.TrueCount.ShouldBe(2);
        run.FalseCount.ShouldBe(2);
        run.FailedCount.ShouldBe(1);
    }

    [Fact]
    public async Task WhenMultipleRunsExist_TotalsAggregateAllRuns()
    {
        // Arrange
        await using var context = await CreateContextWith(
            CreateRun(total: 5, trueCount: 2, falseCount: 2, failed: 1),
            CreateRun(total: 3, trueCount: 1, falseCount: 2, failed: 0),
            CreateRun(total: 4, trueCount: 4, falseCount: 0, failed: 0)
        );
        var handler = new ListJudgeRunsHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.Totals.Runs.ShouldBe(3);
        result.Value.Totals.TotalCount.ShouldBe(12);
        result.Value.Totals.TrueCount.ShouldBe(7);
        result.Value.Totals.FalseCount.ShouldBe(4);
        result.Value.Totals.FailedCount.ShouldBe(1);
    }

    [Fact]
    public async Task WhenPageIsSmallerThanRunCount_TotalsStillCoverAllRuns()
    {
        // Arrange
        await using var context = await CreateContextWith(
            CreateRun(_baseTime.AddMinutes(1), total: 2, trueCount: 1, falseCount: 1),
            CreateRun(_baseTime.AddMinutes(2), total: 2, trueCount: 1, falseCount: 1),
            CreateRun(_baseTime.AddMinutes(3), total: 2, trueCount: 1, falseCount: 1)
        );
        var handler = new ListJudgeRunsHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(limit: 2), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeRuns.Count().ShouldBe(2);
        result.Value.Totals.Runs.ShouldBe(3);
        result.Value.Totals.TotalCount.ShouldBe(6);
    }

    [Fact]
    public async Task WhenMultipleRunsExist_ReturnNewestFirst()
    {
        // Arrange
        var oldest = Guid.NewGuid();
        var middle = Guid.NewGuid();
        var newest = Guid.NewGuid();
        await using var context = await CreateContextWith(
            CreateRun(_baseTime.AddMinutes(2), judgeRunId: middle),
            CreateRun(_baseTime.AddMinutes(1), judgeRunId: oldest),
            CreateRun(_baseTime.AddMinutes(3), judgeRunId: newest)
        );
        var handler = new ListJudgeRunsHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeRuns.Select(r => r.JudgeRunId).ToList().ShouldBe([newest, middle, oldest]);
    }

    [Fact]
    public async Task WhenRunsShareCreatedAt_OrderByRunIdDescending()
    {
        // Arrange
        var lowerId = new Guid("00000000-0000-0000-0000-000000000001");
        var higherId = new Guid("00000000-0000-0000-0000-000000000002");
        await using var context = await CreateContextWith(
            CreateRun(_baseTime, judgeRunId: lowerId),
            CreateRun(_baseTime, judgeRunId: higherId)
        );
        var handler = new ListJudgeRunsHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeRuns.Select(r => r.JudgeRunId).ToList().ShouldBe([higherId, lowerId]);
    }

    [Fact]
    public async Task WhenLimitIsSet_ReturnAtMostLimitRuns()
    {
        // Arrange
        await using var context = await CreateContextWith(
            Enumerable.Range(1, 5).Select(i => CreateRun(_baseTime.AddMinutes(i))).ToArray()
        );
        var handler = new ListJudgeRunsHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(limit: 3), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeRuns.Count().ShouldBe(3);
    }

    [Fact]
    public async Task WhenOffsetIsSet_SkipNewestRuns()
    {
        // Arrange
        var ids = Enumerable.Range(1, 5).Select(_ => Guid.NewGuid()).ToArray();
        await using var context = await CreateContextWith(
            ids.Select((id, i) => CreateRun(_baseTime.AddMinutes(i), judgeRunId: id)).ToArray()
        );
        var handler = new ListJudgeRunsHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(limit: 2, offset: 2), CancellationToken.None);

        // Assert (newest first is ids[4], ids[3], ids[2], ids[1], ids[0])
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeRuns.Select(r => r.JudgeRunId).ToList().ShouldBe([ids[2], ids[1]]);
    }

    [Fact]
    public async Task WhenOffsetIsBeyondLastRun_ReturnEmptyListWithTotals()
    {
        // Arrange
        await using var context = await CreateContextWith(CreateRun(total: 2, trueCount: 2));
        var handler = new ListJudgeRunsHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(offset: 10), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeRuns.ShouldBeEmpty();
        result.Value.Totals.Runs.ShouldBe(1);
    }

    [Fact]
    public async Task WhenRunsExistForOtherProjectOrVersion_IgnoreThem()
    {
        // Arrange
        var ownRunId = Guid.NewGuid();
        await using var context = await CreateContextWith(
            CreateRun(judgeRunId: ownRunId, total: 1, trueCount: 1),
            CreateRun(projectId: Guid.NewGuid(), total: 10, trueCount: 10),
            CreateRun(projectVersionId: Guid.NewGuid(), total: 20, trueCount: 20)
        );
        var handler = new ListJudgeRunsHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeRuns.Single().JudgeRunId.ShouldBe(ownRunId);
        result.Value.Totals.Runs.ShouldBe(1);
        result.Value.Totals.TotalCount.ShouldBe(1);
        result.Value.Totals.TrueCount.ShouldBe(1);
    }

    [Fact]
    public async Task WhenContextIsDisposed_ReturnDatabaseError()
    {
        // Arrange
        var context = new JudgeDbContext(CreateOptions());
        await context.DisposeAsync();
        var handler = new ListJudgeRunsHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }
}