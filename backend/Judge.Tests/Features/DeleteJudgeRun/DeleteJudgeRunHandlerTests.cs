using Judge.Data;
using Judge.Data.Models;
using Judge.Features.DeleteJudgeRun;
using Microsoft.EntityFrameworkCore;
using NSubstitute.ExceptionExtensions;
using NSubstitute;
using Shared;
using Shouldly;

namespace Judge.Tests.Features.DeleteJudgeRun;

public class DeleteJudgeRunHandlerTests
{
    private static readonly Guid _projectId = new("68DF6625-60EA-4E0A-8F29-29DE14197024");
    private static readonly Guid _projectVersionId = new("68DF6625-60EA-4E0A-8F29-29DE14197025");
    private static readonly Guid _judgeRunId = new("68DF6625-60EA-4E0A-8F29-29DE14197026");
    private static readonly Guid _userId = new("CE97539F-4189-44FC-A87F-CFA3EDB177ED");

    private static DbContextOptions<JudgeDbContext> CreateOptions() =>
        new DbContextOptionsBuilder<JudgeDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

    private static DeleteJudgeRunRequest CreateRequest() =>
        new()
        {
            ProjectId = _projectId,
            ProjectVersionId = _projectVersionId,
            JudgeRunId = _judgeRunId,
            UserId = _userId,
        };

    private static JudgeRun CreateRun(
        Guid? judgeRunId = null,
        Guid? projectId = null,
        Guid? projectVersionId = null
    ) =>
        new()
        {
            JudgeRunId = judgeRunId ?? _judgeRunId,
            ProjectId = projectId ?? _projectId,
            ProjectVersionId = projectVersionId ?? _projectVersionId,
            AxialCodeId = Guid.NewGuid(),
            ResultsJson = "[]",
            CreatedAt = DateTimeOffset.UtcNow,
            TotalCount = 0,
            TrueCount = 0,
            FalseCount = 0,
            FailedCount = 0,
        };

    private static async Task Seed(DbContextOptions<JudgeDbContext> options, params JudgeRun[] runs)
    {
        await using var context = new JudgeDbContext(options);
        context.JudgeRuns.AddRange(runs);
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task WhenRunExists_ReturnDeletedJudgeRunId()
    {
        // Arrange
        var options = CreateOptions();
        await Seed(options, CreateRun());
        await using var context = new JudgeDbContext(options);
        var handler = new DeleteJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeRunId.ShouldBe(_judgeRunId);
    }

    [Fact]
    public async Task WhenRunExists_RemoveRunFromDatabase()
    {
        // Arrange
        var options = CreateOptions();
        await Seed(options, CreateRun());
        await using var context = new JudgeDbContext(options);
        var handler = new DeleteJudgeRunHandler(context);

        // Act
        _ = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        await using var verifyContext = new JudgeDbContext(options);
        (await verifyContext.JudgeRuns.AnyAsync()).ShouldBeFalse();
    }

    [Fact]
    public async Task WhenRunDoesNotExist_ReturnEntityNotFound()
    {
        // Arrange
        await using var context = new JudgeDbContext(CreateOptions());
        var handler = new DeleteJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenRunBelongsToOtherProject_ReturnEntityNotFoundAndKeepRun()
    {
        // Arrange
        var options = CreateOptions();
        await Seed(options, CreateRun(projectId: Guid.NewGuid()));
        await using var context = new JudgeDbContext(options);
        var handler = new DeleteJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        await using var verifyContext = new JudgeDbContext(options);
        (await verifyContext.JudgeRuns.CountAsync()).ShouldBe(1);
    }

    [Fact]
    public async Task WhenRunBelongsToOtherVersion_ReturnEntityNotFoundAndKeepRun()
    {
        // Arrange
        var options = CreateOptions();
        await Seed(options, CreateRun(projectVersionId: Guid.NewGuid()));
        await using var context = new JudgeDbContext(options);
        var handler = new DeleteJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        await using var verifyContext = new JudgeDbContext(options);
        (await verifyContext.JudgeRuns.CountAsync()).ShouldBe(1);
    }

    [Fact]
    public async Task WhenRunIsDeleted_KeepOtherRunsOfTheSameVersion()
    {
        // Arrange
        var options = CreateOptions();
        var otherRunId = Guid.NewGuid();
        await Seed(options, CreateRun(), CreateRun(judgeRunId: otherRunId));
        await using var context = new JudgeDbContext(options);
        var handler = new DeleteJudgeRunHandler(context);

        // Act
        _ = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        await using var verifyContext = new JudgeDbContext(options);
        var remaining = await verifyContext.JudgeRuns.ToListAsync();
        remaining.Count.ShouldBe(1);
        remaining[0].JudgeRunId.ShouldBe(otherRunId);
    }

    [Fact]
    public async Task WhenDatabaseThrowsDbUpdateException_ReturnDatabaseError()
    {
        // Arrange
        var options = CreateOptions();
        await Seed(options, CreateRun());
        var context = Substitute.ForPartsOf<JudgeDbContext>(options);
        context.When(c => c.SaveChangesAsync(Arg.Any<CancellationToken>())).DoNotCallBase();
        context.SaveChangesAsync(Arg.Any<CancellationToken>()).Throws(new DbUpdateException());
        var handler = new DeleteJudgeRunHandler(context);

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
        var handler = new DeleteJudgeRunHandler(context);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }
}