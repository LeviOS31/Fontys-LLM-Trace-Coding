using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetProject;
using ProjectVersions.Data;
using ProjectVersions.Data.Models;
using ProjectVersions.Features.EditProjectVersion;
using Shared;
using Shouldly;

namespace ProjectVersions.Tests.Features.EditProjectVersion;

public class EditProjectVersionHandlerTests
{
    [Fact]
    public async Task WhenProjectIsNotAccessible_ReturnNoPermissionError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        var mockMediator = Substitute.For<IMediator>();
        mockMediator.Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.NoPermission);

        var handler = new EditProjectVersionHandler(mockContext, mockMediator);
        var request = CreateRequest();

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.NoPermission);
        await mockContext.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenSelectingVersionFails_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(_ => throw new InvalidOperationException("Database failure"));

        var mockMediator = Substitute.For<IMediator>();
        var request = CreateRequest();
        mockMediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectId));

        var handler = new EditProjectVersionHandler(mockContext, mockMediator);

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

        var mockMediator = Substitute.For<IMediator>();
        mockMediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectId));

        var handler = new EditProjectVersionHandler(mockContext, mockMediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenProjectVersionNameAlreadyExists_ReturnProjectVersionNameAlreadyExistsError()
    {
        // Arrange
        var request = CreateRequest(name: "  release-v2  ");
        var existingVersions = new List<ProjectVersion>
        {
            new()
            {
                VersionId = request.VersionId,
                ProjectId = request.ProjectId,
                Name = "release-v1",
                Description = "Existing",
            },
            new()
            {
                VersionId = Guid.NewGuid(),
                ProjectId = request.ProjectId,
                Name = "RELEASE-V2",
                Description = "Existing duplicate",
            },
        };

        var mockSet = existingVersions.BuildMockDbSet();
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(mockSet);

        var mockMediator = Substitute.For<IMediator>();
        mockMediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectId));

        var handler = new EditProjectVersionHandler(mockContext, mockMediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.ProjectVersionNameAlreadyExists);
        await mockContext.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenSavingFails_ReturnDatabaseError()
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
        mockContext
            .SaveChangesAsync(Arg.Any<CancellationToken>())
            .Throws(new InvalidOperationException("Database failure"));

        var mockMediator = Substitute.For<IMediator>();
        mockMediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectId));

        var handler = new EditProjectVersionHandler(mockContext, mockMediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenRequestIsValid_EditProjectVersion()
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
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var mockMediator = Substitute.For<IMediator>();
        mockMediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectId));

        var handler = new EditProjectVersionHandler(mockContext, mockMediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var response = result.Value;
        response.VersionId.ShouldBe(request.VersionId);
        response.ProjectId.ShouldBe(request.ProjectId);
        response.Name.ShouldBe(request.Name);
        response.Description.ShouldBe(request.Description);
    }

    [Fact]
    public async Task WhenKeepingSameNameAndChangingDescription_EditProjectVersion()
    {
        // Arrange
        var request = new EditProjectVersionRequest
        {
            UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            VersionId = new Guid("739A9348-E7AE-4D46-87B8-0D98E89F8FC7"),
            Name = "release-v1",
            Description = "Updated description only",
        };

        var existingVersions = new List<ProjectVersion>
        {
            new()
            {
                VersionId = request.VersionId,
                ProjectId = request.ProjectId,
                Name = "release-v1",
                Description = "Old description",
            },
            new()
            {
                VersionId = Guid.NewGuid(),
                ProjectId = request.ProjectId,
                Name = "release-v2",
                Description = "Other version",
            },
        };

        var mockSet = existingVersions.BuildMockDbSet();
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var mockMediator = Substitute.For<IMediator>();
        mockMediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectId));

        var handler = new EditProjectVersionHandler(mockContext, mockMediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var response = result.Value;
        response.VersionId.ShouldBe(request.VersionId);
        response.ProjectId.ShouldBe(request.ProjectId);
        response.Name.ShouldBe(request.Name);
        response.Description.ShouldBe(request.Description);
    }

    private static EditProjectVersionRequest CreateRequest(string name = "Release v2")
    {
        return new EditProjectVersionRequest
        {
            UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            VersionId = new Guid("739A9348-E7AE-4D46-87B8-0D98E89F8FC7"),
            Name = name,
            Description = "Updated release",
        };
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
}
