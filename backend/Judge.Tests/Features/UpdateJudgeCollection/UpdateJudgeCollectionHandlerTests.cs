using Judge.Data;
using Judge.Data.Models;
using Judge.Features.UpdateJudgeCollection;
using Mediator;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Projects.Contracts.Features.GetAllProjectVersions;
using Shared;
using Shouldly;

namespace Judge.Tests.Features.UpdateJudgeCollection;

public class UpdateJudgeCollectionHandlerTests
{
    private static readonly Guid _judgeCollectionId = new("68DF6625-60EA-4E0A-8F29-29DE14197024");
    private static readonly Guid _projectId = new("CE97539F-4189-44FC-A87F-CFA3EDB177EE");
    private static readonly Guid _projectVersionId = new("CE97539F-4189-44FC-A87F-CFA3EDB177EF");

    private static DbContextOptions<JudgeDbContext> CreateOptions() =>
        new DbContextOptionsBuilder<JudgeDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

    private static UpdateJudgeCollectionRequest CreateRequest(string name = "Renamed collection") =>
        new()
        {
            JudgeCollectionId = _judgeCollectionId,
            ProjectId = _projectId,
            ProjectVersionId = _projectVersionId,
            Name = name,
        };

    private static async Task<JudgeDbContext> CreateContextWithCollection(
        Guid? collectionId = null,
        Guid? versionId = null
    )
    {
        var context = new JudgeDbContext(CreateOptions());
        context.JudgeCollections.Add(
            new JudgeCollection
            {
                JudgeCollectionId = collectionId ?? _judgeCollectionId,
                ProjectVersionId = versionId ?? _projectVersionId,
                Name = "Original collection",
                CreatedAt = DateTimeOffset.UtcNow,
            }
        );
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
    public async Task WhenCollectionExists_RenamesAndTrimsTheName()
    {
        await using var context = await CreateContextWithCollection();
        var handler = new UpdateJudgeCollectionHandler(context, CreateMediator(_projectVersionId));

        var result = await handler.Handle(CreateRequest("  Regression checks  "), CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value!.JudgeCollectionId.ShouldBe(_judgeCollectionId);
        result.Value.Name.ShouldBe("Regression checks");
        (await context.JudgeCollections.SingleAsync()).Name.ShouldBe("Regression checks");
    }

    [Fact]
    public async Task WhenProjectVersionIsNotAccessible_ReturnsNotFoundWithoutUpdating()
    {
        await using var context = await CreateContextWithCollection();
        var handler = new UpdateJudgeCollectionHandler(context, CreateMediator(Guid.NewGuid()));

        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        (await context.JudgeCollections.SingleAsync()).Name.ShouldBe("Original collection");
    }

    [Fact]
    public async Task WhenCollectionDoesNotBelongToProjectVersion_ReturnsNotFound()
    {
        await using var context = await CreateContextWithCollection(versionId: Guid.NewGuid());
        var handler = new UpdateJudgeCollectionHandler(context, CreateMediator(_projectVersionId));

        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenProjectVersionLookupFails_ReturnsMediatorError()
    {
        await using var context = await CreateContextWithCollection();
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetAllProjectVersionsQuery>(), Arg.Any<CancellationToken>())
            .Returns(ErrorCode.DatabaseError);
        var handler = new UpdateJudgeCollectionHandler(context, mediator);

        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }
}