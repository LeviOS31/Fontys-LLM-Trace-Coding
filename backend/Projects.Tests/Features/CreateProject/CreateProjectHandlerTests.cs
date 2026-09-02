using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Data;
using Projects.Features.CreateProject;
using Shared;
using Shouldly;
using Xunit;

namespace Projects.Tests.Features.CreateProject;

public class CreateProjectHandlerTests
{
    [Fact]
    public async Task WhenRequestIsValid_CreateProject()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var handler = new CreateProjectHandler(mockContext);
        var request = new CreateProjectRequest
        {
            UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
            Name = "TestNaam",
            Description = "TestDescription",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var response = result.Value;
        response.ProjectId.ShouldNotBe(Guid.Empty);
        response.Name.ShouldBe("TestNaam");
        response.Description.ShouldBe("TestDescription");
    }

    [Fact]
    public async Task WhenDatabaseFails_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Throws(new NpgsqlException());

        var handler = new CreateProjectHandler(mockContext);
        var request = new CreateProjectRequest
        {
            UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
            Name = "TestNaam",
            Description = "TestDescription",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenDatabaseReturnsNoChanges_ReturnNoChangesError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(0);

        var handler = new CreateProjectHandler(mockContext);
        var request = new CreateProjectRequest
        {
            UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
            Name = "TestNaam",
            Description = "TestDescription",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.NoChanges);
    }
}
