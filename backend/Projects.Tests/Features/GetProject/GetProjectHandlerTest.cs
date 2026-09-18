using Mediator;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetAllAssessmentCriteriaOfProject;
using Projects.Contracts.Features.GetAllProjectVersions;
using Projects.Contracts.Features.GetProject;
using Projects.Data;
using Projects.Data.Models;
using Projects.Features.GetProject;
using Shared;
using Shouldly;

namespace Projects.Tests.Features.GetProject;

public class GetProjectHandlerTest
{
    private static ProjectDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ProjectDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ProjectDbContext(options);
    }

    [Fact]
    public async Task WhenProjectExists_ReturnProject()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        await using var context = CreateContext();
        context.Projects.AddRange(
            new Project
            {
                ProjectId = projectId,
                Name = "Project A",
                Description = "Desc A",
                UserId = userId,
            },
            new Project
            {
                ProjectId = Guid.NewGuid(),
                Name = "Project B",
                Description = "Desc B",
                UserId = userId,
            }
        );
        await context.SaveChangesAsync();

        var versionsResponse = new GetAllProjectVersionsResponse
        {
            Versions =
            [
                new GetAllProjectVersionsResponse.ProjectVersionSummary
                {
                    VersionId = Guid.NewGuid(),
                    ProjectId = projectId,
                    Name = "v1",
                    Description = "First version",
                },
            ],
        };
        var assessmentCriteriaResponse = new GetAllAssessmentCriteriaOfProjectResponse { criteriaList = [] };
        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Is<GetAllProjectVersionsQuery>(q => q.ProjectId == projectId), Arg.Any<CancellationToken>())
            .Returns(versionsResponse);
        mediator
            .Send(
                Arg.Is<GetAllAssessmentCriteriaOfProjectQuery>(q => q.ProjectId == projectId),
                Arg.Any<CancellationToken>()
            )
            .Returns(assessmentCriteriaResponse);

        var handler = new GetProjectHandler(context, mediator);
        var query = new GetProjectQuery { UserId = userId, ProjectId = projectId };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ProjectId.ShouldBe(projectId);
        result.Value.Name.ShouldBe("Project A");
        result.Value.Description.ShouldBe("Desc A");
        result.Value.Versions.Count.ShouldBe(1);
        result.Value.Versions[0].Name.ShouldBe("v1");
        result.Value.AssessmentCriteria.Count.ShouldBe(0);
    }

    [Fact]
    public async Task WhenProjectDoesNotExist_ReturnEntityNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        await using var context = CreateContext();

        var mediator = Substitute.For<IMediator>();
        var handler = new GetProjectHandler(context, mediator);
        var query = new GetProjectQuery { UserId = userId, ProjectId = projectId };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenUserUnauthorized_ReturnNoPermission()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        await using var context = CreateContext();
        context.Projects.Add(
            new Project
            {
                ProjectId = projectId,
                Name = "Project A",
                Description = "Desc A",
                UserId = Guid.NewGuid(),
            }
        );
        await context.SaveChangesAsync();

        var mediator = Substitute.For<IMediator>();
        var handler = new GetProjectHandler(context, mediator);
        var query = new GetProjectQuery { UserId = userId, ProjectId = projectId };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.NoPermission);
    }

    [Fact]
    public async Task WhenGetProjectVersionsFails_ReturnMediatorError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        await using var context = CreateContext();
        context.Projects.Add(
            new Project
            {
                ProjectId = projectId,
                Name = "Project A",
                Description = "Desc A",
                UserId = userId,
            }
        );
        await context.SaveChangesAsync();

        var mediator = Substitute.For<IMediator>();
        mediator
            .Send(Arg.Is<GetAllProjectVersionsQuery>(q => q.ProjectId == projectId), Arg.Any<CancellationToken>())
            .Returns(ErrorCode.DatabaseError);

        var handler = new GetProjectHandler(context, mediator);
        var query = new GetProjectQuery { UserId = userId, ProjectId = projectId };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenSelectingFails_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);
        var mediator = Substitute.For<IMediator>();

        mockContext.Projects.Throws(new NpgsqlException());

        var handler = new GetProjectHandler(mockContext, mediator);
        var query = new GetProjectQuery
        {
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
        };
        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }
}
