using Judge.Data;
using Judge.Data.Models;
using Judge.Features.GetJudgeRun;
using Judge.Features.JudgeTracesForAxialCode;
using Mediator;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Projects.Contracts.Features.GetAllProjectVersions;
using Shared;
using Shouldly;
using System.Text.Json;

namespace Judge.Tests.Features.GetJudgeRun;

public class GetJudgeRunHandlerTests
{
    private static readonly Guid _judgeCollectionId = new("68DF6625-60EA-4E0A-8F29-29DE14197024");
    private static readonly Guid _judgeRunId = new("68DF6625-60EA-4E0A-8F29-29DE14197026");
    private static readonly Guid _userId = new("CE97539F-4189-44FC-A87F-CFA3EDB177ED");
    private static readonly Guid _projectId = new("CE97539F-4189-44FC-A87F-CFA3EDB177EE");
    private static readonly Guid _projectVersionId = new("CE97539F-4189-44FC-A87F-CFA3EDB177EF");

    private static DbContextOptions<JudgeDbContext> CreateOptions() =>
        new DbContextOptionsBuilder<JudgeDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

    private static GetJudgeRunRequest CreateRequest() =>
        new()
        {
            JudgeCollectionId = _judgeCollectionId,
            ProjectId = _projectId,
            ProjectVersionId = _projectVersionId,
            JudgeRunId = _judgeRunId,
            UserId = _userId,
        };

    private static JudgeRun CreateRun(string resultsJson) =>
        new()
        {
            JudgeRunId = _judgeRunId,
            JudgeCollectionId = _judgeCollectionId,
            ResultsJson = resultsJson,
            CreatedAt = DateTimeOffset.UtcNow,
            TotalCount = 0,
            TrueCount = 0,
            FalseCount = 0,
            FailedCount = 0,
        };

    private static async Task<JudgeDbContext> CreateContextWith(
        string? resultsJson = null,
        bool includeCollection = true,
        bool includeRun = true
    )
    {
        var context = new JudgeDbContext(CreateOptions());

        if (includeCollection)
        {
            context.JudgeCollections.Add(
                new JudgeCollection
                {
                    Name = "Collection",
                    JudgeCollectionId = _judgeCollectionId,
                    ProjectVersionId = _projectVersionId,
                    CreatedAt = DateTime.UtcNow,
                }
            );
        }

        if (includeRun)
        {
            context.JudgeRuns.Add(CreateRun(resultsJson ?? "[]"));
        }

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
        await using var context = await CreateContextWith(json);
        var mediator = CreateMediator(_projectVersionId);
        var handler = new GetJudgeRunHandler(context, mediator);

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
    public async Task WhenRunHasErroredTrace_ReturnErrorDetails()
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
        await using var context = await CreateContextWith(json);
        var handler = new GetJudgeRunHandler(context, CreateMediator(_projectVersionId));

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
    public async Task WhenResultsJsonIsNull_ReturnEmptyResults()
    {
        // Arrange
        await using var context = await CreateContextWith("null");
        var handler = new GetJudgeRunHandler(context, CreateMediator(_projectVersionId));

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value!.Results.ShouldBeEmpty();
    }

    [Fact]
    public async Task WhenCollectionDoesNotExist_ReturnEntityNotFoundWithoutLoadingVersions()
    {
        // Arrange
        await using var context = await CreateContextWith(includeCollection: false);
        var mediator = CreateMediator(_projectVersionId);
        var handler = new GetJudgeRunHandler(context, mediator);

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
        await using var context = await CreateContextWith();
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<GetAllProjectVersionsQuery>(), Arg.Any<CancellationToken>())
            .Returns(ErrorCode.DatabaseError);
        var handler = new GetJudgeRunHandler(context, mediator);

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenVersionDoesNotExist_ReturnEntityNotFound()
    {
        // Arrange
        await using var context = await CreateContextWith();
        var handler = new GetJudgeRunHandler(context, CreateMediator(Guid.NewGuid()));

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenRunDoesNotExist_ReturnEntityNotFound()
    {
        // Arrange
        await using var context = await CreateContextWith(includeRun: false);
        var handler = new GetJudgeRunHandler(context, CreateMediator(_projectVersionId));

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
        await using var context = await CreateContextWith("{ this is not valid json");
        var handler = new GetJudgeRunHandler(context, CreateMediator(_projectVersionId));

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenContextFailsLoadingCollection_ReturnDatabaseError()
    {
        // Arrange
        var context = new JudgeDbContext(CreateOptions());
        await context.DisposeAsync();
        var handler = new GetJudgeRunHandler(context, CreateMediator(_projectVersionId));

        // Act
        var result = await handler.Handle(CreateRequest(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }
}
