using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using ProjectVersions.Contracts.Features.InternalDeleteAllProjectVersions;
using ProjectVersions.Data;
using ProjectVersions.Data.Models;
using ProjectVersions.Features.InternalDeleteAllProjectVersions;
using ProjectVersions.Shared;
using Shared;
using Shouldly;
using Traces.Contracts.Features.DeleteAllTracesOfVersion;

namespace ProjectVersions.Tests.Features.DeleteAllProjectVersions;

public class InternalDeleteAllProjectVersionsHandlerTests
{
    [Fact]
    public async Task WhenProjectVersionsExist_DeleteAllProjectVersions()
    {
        // Arrange
        var projectId = Guid.NewGuid();

        var versions = new List<ProjectVersion>
        {
            new ProjectVersion
            {
                VersionId = Guid.NewGuid(),
                ProjectId = projectId,
                Name = "v1",
                Description = "First",
            },
            new ProjectVersion
            {
                VersionId = Guid.NewGuid(),
                ProjectId = projectId,
                Name = "v2",
                Description = "Second",
            },
        };

        var mockSet = versions.BuildMockDbSet();
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(mockSet);

        var handler = new InternalDeleteAllProjectVersionsHandler(
            mockContext,
            CreateDeleteVersion(mockContext, CreateMediator())
        );
        var request = new InternalDeleteAllProjectVersionsRequest { ProjectId = projectId };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task WhenDeletingVersionsThrows_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(_ => throw new InvalidOperationException("Database failure"));

        var handler = new InternalDeleteAllProjectVersionsHandler(
            mockContext,
            CreateDeleteVersion(mockContext, CreateMediator())
        );
        var request = new InternalDeleteAllProjectVersionsRequest { ProjectId = Guid.NewGuid() };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenNoProjectVersionsExist_ReturnNoChangesError()
    {
        // Arrange
        var mockSet = new List<ProjectVersion>().BuildMockDbSet();
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(mockSet);

        var handler = new InternalDeleteAllProjectVersionsHandler(
            mockContext,
            CreateDeleteVersion(mockContext, CreateMediator())
        );
        var request = new InternalDeleteAllProjectVersionsRequest { ProjectId = Guid.NewGuid() };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.NoChanges);
    }

    [Fact]
    public async Task WhenDeletingTracesFails_ReturnDatabaseError()
    {
        // Arrange
        var projectId = Guid.NewGuid();
        var mockSet = new List<ProjectVersion>
        {
            new()
            {
                VersionId = Guid.NewGuid(),
                ProjectId = projectId,
                Name = "v1",
                Description = "First",
            },
        }.BuildMockDbSet();
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(mockSet);

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<DeleteAllTracesOfVersionRequest>(), Arg.Any<CancellationToken>())
            .Returns(ErrorCode.DatabaseError);

        var handler = new InternalDeleteAllProjectVersionsHandler(
            mockContext,
            CreateDeleteVersion(mockContext, mediator)
        );
        var request = new InternalDeleteAllProjectVersionsRequest { ProjectId = projectId };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    private static IMediator CreateMediator()
    {
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<DeleteAllTracesOfVersionRequest>(), Arg.Any<CancellationToken>())
            .Returns(new DeleteAllTracesOfVersionResponse());
        return mediator;
    }

    private static DeleteVersion CreateDeleteVersion(ProjectVersionsDbContext context, IMediator mediator)
    {
        return new DeleteVersion(context, mediator);
    }
}
