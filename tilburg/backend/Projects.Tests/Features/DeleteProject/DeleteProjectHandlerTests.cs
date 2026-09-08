using AssessmentCriteria.Contracts.Features.InternalDeleteAllAssessmentCriteriaOfProject;
using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Data;
using Projects.Data.Models;
using Projects.Features.DeleteProject;
using ProjectVersions.Contracts.Features.InternalDeleteAllProjectVersions;
using Shared;
using Shouldly;

namespace Projects.Tests.Features.DeleteProject;

public class DeleteProjectHandlerTests
{
    private static IMediator CreateMediatorMock(ErrorCode? errorCode = null)
    {
        var mediator = Substitute.For<IMediator>();
        Result<InternalDeleteAllProjectVersionsResponse> versionsResult = errorCode is null
            ? new InternalDeleteAllProjectVersionsResponse()
            : errorCode.Value;
        Result<InternalDeleteAllAssessmentCriteriaOfProjectResponse> assessmentCriteriaResult = errorCode is null
            ? new InternalDeleteAllAssessmentCriteriaOfProjectResponse()
            : errorCode.Value;

        mediator
            .Send(Arg.Any<InternalDeleteAllProjectVersionsRequest>(), Arg.Any<CancellationToken>())
            .Returns(versionsResult);
        mediator
            .Send(Arg.Any<InternalDeleteAllAssessmentCriteriaOfProjectRequest>(), Arg.Any<CancellationToken>())
            .Returns(assessmentCriteriaResult);

        return mediator;
    }

    [Fact]
    public async Task WhenRequestIsValid_DeleteProject()
    {
        // Arrange
        var projects = new List<Project>
        {
            new()
            {
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                Name = "TestProject",
                Description = "Description",
            },
        };

        var mockSet = projects.BuildMockDbSet();
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);
        mockContext.Projects.Returns(mockSet);

        var handler = new DeleteProjectHandler(mockContext, CreateMediatorMock());
        var request = new DeleteProjectRequest
        {
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task WhenRequestIsValid_CallDeleteAllProjectVersions()
    {
        // Arrange
        var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");
        var userId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");

        var projects = new List<Project>
        {
            new()
            {
                ProjectId = projectId,
                UserId = userId,
                Name = "TestProject",
                Description = "Description",
            },
        };

        var mockSet = projects.BuildMockDbSet();
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);
        mockContext.Projects.Returns(mockSet);

        var mediator = CreateMediatorMock();
        var handler = new DeleteProjectHandler(mockContext, mediator);
        var request = new DeleteProjectRequest { ProjectId = projectId, UserId = userId };

        // Act
        _ = await handler.Handle(request, CancellationToken.None);

        // Assert
        await mediator
            .Received(1)
            .Send(
                Arg.Is<InternalDeleteAllProjectVersionsRequest>(r => r.ProjectId == projectId),
                Arg.Any<CancellationToken>()
            );
    }

    [Fact]
    public async Task WhenSelectingFails_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);
        mockContext.Projects.Throws(new NpgsqlException());

        var handler = new DeleteProjectHandler(mockContext, CreateMediatorMock());
        var request = new DeleteProjectRequest
        {
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenDeletingFails_ReturnDatabaseError()
    {
        // Arrange
        var projects = new List<Project>
        {
            new()
            {
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                Name = "TestProject",
                Description = "Description",
            },
        };

        var mockSet = projects.BuildMockDbSet();
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);
        mockContext.Projects.Returns(_ => mockSet, _ => throw new InvalidOperationException());

        var handler = new DeleteProjectHandler(mockContext, CreateMediatorMock());
        var request = new DeleteProjectRequest
        {
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenProjectDoesNotExist_ReturnNotFoundError()
    {
        // Arrange
        var projects = new List<Project>
        {
            new()
            {
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                Name = "TestProject",
                Description = "Description",
            },
        };

        var mockSet = projects.BuildMockDbSet();
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);
        mockContext.Projects.Returns(mockSet);

        var handler = new DeleteProjectHandler(mockContext, CreateMediatorMock());
        var request = new DeleteProjectRequest()
        {
            UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14190000"),
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenProjectIsFromDifferentUser_ReturnNoPermissionError()
    {
        // Arrange
        var projects = new List<Project>
        {
            new()
            {
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                Name = "TestProject",
                Description = "Beschrijving",
            },
        };

        var mockSet = projects.BuildMockDbSet();
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);
        mockContext.Projects.Returns(mockSet);

        var handler = new DeleteProjectHandler(mockContext, CreateMediatorMock());
        var request = new DeleteProjectRequest()
        {
            UserId = new Guid("FAFED473-E134-4E47-903F-C93551000000"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.NoPermission);
    }

    [Fact]
    public async Task NoChanges_ReturnNoChangesError()
    {
        // Arrange
        var project1 = new List<Project>
        {
            new()
            {
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                Name = "TestProject",
                Description = "Beschrijving",
            },
        };

        var mockSet1 = project1.BuildMockDbSet();
        var emptyList = new List<Project> { };

        var emptyListMock = emptyList.BuildMockDbSet();
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);
        mockContext.Projects.Returns(mockSet1, emptyListMock);

        var handler = new DeleteProjectHandler(mockContext, CreateMediatorMock());
        var request = new DeleteProjectRequest()
        {
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.NoChanges);
    }
}
