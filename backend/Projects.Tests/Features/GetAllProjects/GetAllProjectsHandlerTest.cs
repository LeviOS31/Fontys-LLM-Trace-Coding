using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Projects.Data;
using Projects.Data.Models;
using Projects.Features.GetAllProjects;
using Shared;
using Shouldly;
using Xunit;

namespace Projects.Tests.Features.GetAllProjects;

public class GetAllProjectsHandlerTest
{
    private static ProjectDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ProjectDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ProjectDbContext(options);
    }

    [Fact]
    public async Task WhenProjectsExist_ReturnProjects()
    {
        // Arrange
        var userId = Guid.NewGuid();

        await using var context = CreateContext();
        context.Projects.AddRange(
            new Project
            {
                ProjectId = Guid.NewGuid(),
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

        var handler = new GetAllProjectsHandler(context);
        var query = new GetAllProjectsQuery { UserId = userId };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Projects.Count.ShouldBe(2);
        result.Value.Projects.Any(p => p.Name == "Project A").ShouldBeTrue();
        result.Value.Projects.Any(p => p.Name == "Project B").ShouldBeTrue();
    }

    [Fact]
    public async Task WhenNoProjectsExist_ReturnEmptyList()
    {
        // Arrange
        await using var context = CreateContext();

        var handler = new GetAllProjectsHandler(context);
        var query = new GetAllProjectsQuery { UserId = Guid.NewGuid() };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Projects.Count.ShouldBe(0);
    }

    [Fact]
    public async Task WhenDatabaseThrows_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);

        mockContext.Projects.Returns(x => throw new InvalidOperationException());

        var handler = new GetAllProjectsHandler(mockContext);
        var query = new GetAllProjectsQuery { UserId = Guid.NewGuid() };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }
}
