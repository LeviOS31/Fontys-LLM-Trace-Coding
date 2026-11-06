using Judge.Data;
using Judge.Data.Models;
using Judge.Features.DeleteJudgeRun;
using Mediator;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetAllProjectVersions;
using Shared;
using Shouldly;

namespace Judge.Tests.Features.DeleteJudgeRun;

public class DeleteJudgeRunHandlerTests
{
    private static readonly Guid _judgeCollectionId = new("68DF6625-60EA-4E0A-8F29-29DE14197024");
    private static readonly Guid _judgeRunId = new("68DF6625-60EA-4E0A-8F29-29DE14197026");
    private static readonly Guid _userId = new("CE97539F-4189-44FC-A87F-CFA3EDB177ED");
    private static readonly Guid _projectId = new("CE97539F-4189-44FC-A87F-CFA3EDB177EE");
    private static readonly Guid _projectVersionId = new("CE97539F-4189-44FC-A87F-CFA3EDB177EF");

    private static DbContextOptions<JudgeDbContext> CreateOptions() =>
        new DbContextOptionsBuilder<JudgeDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

    private static DeleteJudgeRunRequest CreateRequest() =>
        new()
        {
            JudgeCollectionId = _judgeCollectionId,
            ProjectId = _projectId,
            ProjectVersionId = _projectVersionId,
            JudgeRunId = _judgeRunId,
            UserId = _userId,
        };

    private static JudgeRun CreateRun(Guid? judgeRunId = null) =>
        new()
        {
            JudgeRunId = judgeRunId ?? _judgeRunId,
            JudgeCollectionId = _judgeCollectionId,
            ResultsJson = "[]",
            CreatedAt = DateTimeOffset.UtcNow,
            TotalCount = 0,
            TrueCount = 0,
            FalseCount = 0,
            FailedCount = 0,
        };

    private static async Task<JudgeDbContext> CreateContextWith(
        bool includeCollection = true,
        params JudgeRun[] runs
    )
    {
        var context = new JudgeDbContext(CreateOptions());

        if (includeCollection)
        {
            context.JudgeCollections.Add(
                new JudgeCollection
                {
                    JudgeCollectionId = _judgeCollectionId,
                    ProjectVersionId = _projectVersionId,
                    Name = "Collection",
                    CreatedAt = DateTime.UtcNow,
                }
            );
        }

        context.JudgeRuns.AddRange(runs);
        await context.SaveChangesAsync();
        return context;
    }

    private static IMediator CreateMediator(params Guid[] versionIds)
    {
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetAllProjectVersionsQuery>(), Arg.Any<CancellationToken>())
            .Returns(
                new GetAllProjectVersionsResponse
                {
                    Versions = versionIds
                        .Select(versionId => new GetAllProjectVersionsResponse.ProjectVersionSummary
                        {
                            VersionId = versionId,
                            ProjectId = _projectId,
                            Name = "Version",
                            Description = "Test version",
                        })
                        .ToList(),
                }
            );
        return mediator;
    }

    [Fact]
    public async Task WhenRunExists_ReturnDeletedJudgeRunId()
    {
        // Arrange
        await using var context = await CreateContextWith(runs: [CreateRun()]);
        var handler = new DeleteJudgeRunHandler(context, CreateMediator(_projectVersionId));

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
        await using (var seedContext = new JudgeDbContext(options))
        {
            seedContext.JudgeCollections.Add(
                new JudgeCollection
                {
                    JudgeCollectionId = _judgeCollectionId,
                    ProjectVersionId = _projectVersionId,
                    Name = "Collection",
                    CreatedAt = DateTime.UtcNow,
                }
            );
            seedContext.JudgeRuns.Add(CreateRun());
            await seedContext.SaveChangesAsync();
        }

        await using var context = new JudgeDbContext(options);
        var handler = new DeleteJudgeRunHandler(context, CreateMediator(_projectVersionId));

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        await using var verifyContext = new JudgeDbContext(options);
        (await verifyContext.JudgeRuns.AnyAsync()).ShouldBeFalse();
    }

    [Fact]
    public async Task WhenCollectionDoesNotExist_ReturnEntityNotFoundWithoutLoadingVersions()
    {
        // Arrange
        await using var context = await CreateContextWith(includeCollection: false, runs: [CreateRun()]);
        var mediator = CreateMediator(_projectVersionId);
        var handler = new DeleteJudgeRunHandler(context, mediator);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        await mediator.DidNotReceive().Send(Arg.Any<GetAllProjectVersionsQuery>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenVersionLookupFails_ReturnMediatorError()
    {
        // Arrange
        await using var context = await CreateContextWith(runs: [CreateRun()]);
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetAllProjectVersionsQuery>(), Arg.Any<CancellationToken>())
            .Returns(ErrorCode.DatabaseError);
        var handler = new DeleteJudgeRunHandler(context, mediator);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenVersionDoesNotExist_ReturnEntityNotFoundAndKeepRun()
    {
        // Arrange
        await using var context = await CreateContextWith(runs: [CreateRun()]);
        var handler = new DeleteJudgeRunHandler(context, CreateMediator(Guid.NewGuid()));

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        (await context.JudgeRuns.AnyAsync()).ShouldBeTrue();
    }

    [Fact]
    public async Task WhenRunDoesNotExist_ReturnEntityNotFound()
    {
        // Arrange
        await using var context = await CreateContextWith();
        var handler = new DeleteJudgeRunHandler(context, CreateMediator(_projectVersionId));

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenRunIsDeleted_KeepOtherRuns()
    {
        // Arrange
        var otherRunId = Guid.NewGuid();
        await using var context = await CreateContextWith(runs: [CreateRun(), CreateRun(otherRunId)]);
        var handler = new DeleteJudgeRunHandler(context, CreateMediator(_projectVersionId));

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var remaining = await context.JudgeRuns.ToListAsync();
        remaining.Count.ShouldBe(1);
        remaining[0].JudgeRunId.ShouldBe(otherRunId);
    }

    [Fact]
    public async Task WhenSaveChangesFails_ReturnDatabaseError()
    {
        // Arrange
        var options = CreateOptions();
        await using var seedContext = new JudgeDbContext(options);
        seedContext.JudgeCollections.Add(
            new JudgeCollection
            {
                JudgeCollectionId = _judgeCollectionId,
                ProjectVersionId = _projectVersionId,
                Name = "Collection",
                CreatedAt = DateTime.UtcNow,
            }
        );
        seedContext.JudgeRuns.Add(CreateRun());
        await seedContext.SaveChangesAsync();

        var context = Substitute.ForPartsOf<JudgeDbContext>(options);
        context.When(c => c.SaveChangesAsync(Arg.Any<CancellationToken>())).DoNotCallBase();
        context.SaveChangesAsync(Arg.Any<CancellationToken>()).Throws(new DbUpdateException());
        var handler = new DeleteJudgeRunHandler(context, CreateMediator(_projectVersionId));

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }
}
