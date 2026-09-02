using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetProject;
using ProjectVersions.Data;
using ProjectVersions.Data.Models;
using ProjectVersions.Features.CreateProjectVersion;
using Shared;
using Shouldly;

namespace ProjectVersions.Tests.Features.CreateProjectVersion;

public class CreateProjectVersionHandlerTests
{
    [Fact]
    public async Task WhenProjectDoesNotExist_ReturnEntityNotFoundError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        var mockMediator = Substitute.For<IMediator>();
        mockMediator.Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.EntityNotFound);

        var handler = new CreateProjectVersionHandler(mockContext, mockMediator);
        var request = CreateRequest();

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenProjectIsNotAccessible_ReturnNoPermissionError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        var mockMediator = Substitute.For<IMediator>();
        mockMediator.Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>()).Returns(ErrorCode.NoPermission);

        var handler = new CreateProjectVersionHandler(mockContext, mockMediator);
        var request = CreateRequest();

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.NoPermission);
    }

    [Fact]
    public async Task WhenProjectVersionNameAlreadyExists_ReturnProjectVersionNameAlreadyExistsError()
    {
        // Arrange
        var request = CreateRequest(name: "  release-v1  ");
        var existingVersions = new List<ProjectVersion>
        {
            new()
            {
                VersionId = Guid.NewGuid(),
                ProjectId = request.ProjectId,
                Name = "RELEASE-V1",
                Description = "Existing",
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

        var handler = new CreateProjectVersionHandler(mockContext, mockMediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.ProjectVersionNameAlreadyExists);
        await mockContext.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenDatabaseFails_ReturnDatabaseError()
    {
        // Arrange
        var request = CreateRequest();
        var mockSet = new List<ProjectVersion>().BuildMockDbSet();
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

        var handler = new CreateProjectVersionHandler(mockContext, mockMediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenRequestIsValid_CreateProjectVersion()
    {
        // Arrange
        var request = CreateRequest();
        var mockSet = new List<ProjectVersion>().BuildMockDbSet();
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var mockMediator = Substitute.For<IMediator>();
        mockMediator
            .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
            .Returns(CreateProjectResponse(request.ProjectId));

        var handler = new CreateProjectVersionHandler(mockContext, mockMediator);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var response = result.Value;
        response.VersionId.ShouldNotBe(Guid.Empty);
        response.ProjectId.ShouldBe(request.ProjectId);
        response.Name.ShouldBe(request.Name);
        response.Description.ShouldBe(request.Description);
    }

    private static CreateProjectVersionRequest CreateRequest(string name = "Release v1")
    {
        return new CreateProjectVersionRequest
        {
            UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            Name = name,
            Description = "Initial release",
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
