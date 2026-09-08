using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using Projects.Contracts.Features.GetProject;
using ProjectVersions.Data;
using ProjectVersions.Data.Models;
using ProjectVersions.Features.DeleteProjectVersion;
using ProjectVersions.Shared;
using Shared;
using Shouldly;
using Traces.Contracts.Features.DeleteAllTracesOfVersion;

namespace ProjectVersions.Tests.Features.DeleteProjectVersion;

public class DeleteProjectVersionHandlerTests
{
    [Fact]
    public async Task WhenProjectIsNotAccessible_ReturnNoPermissionError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        var mockMediator = CreateMediator();
        mockMediator.Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.NoPermission);

        var handler = CreateHandler(mockContext, mockMediator);
        var request = CreateRequest();

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.NoPermission);
    }

    [Fact]
    public async Task WhenSelectingVersionFails_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(_ => throw new InvalidOperationException("Database failure"));

        var mockMediator = CreateMediator();
        var request = CreateRequest();
        mockMediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectId));

        var handler = CreateHandler(mockContext, mockMediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenVersionDoesNotExist_ReturnEntityNotFoundError()
    {
        // Arrange
        var request = CreateRequest();
        var mockSet = new List<ProjectVersion>().BuildMockDbSet();
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(mockSet);

        var mockMediator = CreateMediator();
        mockMediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectId));

        var handler = CreateHandler(mockContext, mockMediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenDeletingFails_ReturnDatabaseError()
    {
        // Arrange
        var request = CreateRequest();
        var existingVersions = new List<ProjectVersion>
        {
            new()
            {
                VersionId = request.VersionId,
                ProjectId = request.ProjectId,
                Name = "release-v1",
                Description = "Existing",
            },
        };

        var mockSet = existingVersions.BuildMockDbSet();
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(mockSet);

        var mockMediator = CreateMediator();
        mockMediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectId));
        mockMediator
            .Send(Arg.Any<DeleteAllTracesOfVersionRequest>(), Arg.Any<CancellationToken>())
            .Returns(ErrorCode.DatabaseError);

        var handler = CreateHandler(mockContext, mockMediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenNoRowsWereDeleted_ReturnNoChangesError()
    {
        // Arrange
        var request = CreateRequest();
        var existingVersions = new List<ProjectVersion>
        {
            new()
            {
                VersionId = request.VersionId,
                ProjectId = request.ProjectId,
                Name = "release-v1",
                Description = "Existing",
            },
        };

        var firstReadSet = existingVersions.BuildMockDbSet();
        var secondDeleteSet = new List<ProjectVersion>().BuildMockDbSet();
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(firstReadSet, secondDeleteSet);

        var mockMediator = CreateMediator();
        mockMediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectId));

        var handler = CreateHandler(mockContext, mockMediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.NoChanges);
    }

    [Fact]
    public async Task WhenRequestIsValid_DeleteProjectVersion()
    {
        // Arrange
        var request = CreateRequest();
        var existingVersions = new List<ProjectVersion>
        {
            new()
            {
                VersionId = request.VersionId,
                ProjectId = request.ProjectId,
                Name = "release-v1",
                Description = "Existing",
            },
        };

        var mockSet = existingVersions.BuildMockDbSet();
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(mockSet);

        var mockMediator = CreateMediator();
        mockMediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectId));

        var handler = CreateHandler(mockContext, mockMediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task WhenMediatorLookupFails_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        var mockMediator = CreateMediator();
        mockMediator.Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.DatabaseError);

        var handler = CreateHandler(mockContext, mockMediator);
        var request = CreateRequest();

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    private static DeleteProjectVersionRequest CreateRequest()
    {
        return new DeleteProjectVersionRequest
        {
            UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            VersionId = new Guid("739A9348-E7AE-4D46-87B8-0D98E89F8FC7"),
        };
    }

    private static DeleteProjectVersionHandler CreateHandler(ProjectVersionsDbContext context, IMediator mediator)
    {
        return new DeleteProjectVersionHandler(context, mediator, new DeleteVersion(context, mediator));
    }

    private static GetProjectResponse CreateProjectResponse(Guid projectId)
    {
        return new GetProjectResponse
        {
            ProjectId = projectId,
            Name = "Project Name",
            Description = "Project Description",
            Versions = [],
            AssessmentCriteria = [],
        };
    }

    private static IMediator CreateMediator()
    {
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Any<DeleteAllTracesOfVersionRequest>(), Arg.Any<CancellationToken>())
            .Returns(new DeleteAllTracesOfVersionResponse());
        return mediator;
    }
}
