using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Data;
using Projects.Data.Models;
using Projects.Features.EditProject;
using Shared;
using Shouldly;
using Xunit;

namespace Projects.Tests.Features.EditProject;

public class EditProjectHandlerTests
{
    [Fact]
    public async Task WhenRequestIsValid_EditProject()
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

        var handler = new EditProjectHandler(mockContext);
        var request = new EditProjectRequest
        {
            UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            Name = "Nieuwe naam",
            Description = "Nieuwe beschrijving",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var response = result.Value;
        response.ProjectId.ShouldBe(request.ProjectId);
        response.Name.ShouldBe(request.Name);
        response.Description.ShouldBe(request.Description);
    }

    [Fact]
    public async Task WhenSelectingFails_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);
        mockContext.Projects.Throws(new NpgsqlException());

        var handler = new EditProjectHandler(mockContext);
        var request = new EditProjectRequest
        {
            UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            Name = "Nieuwe naam",
            Description = "Nieuwe beschrijving",
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
        var projects = new List<Project>();

        var mockSet = projects.BuildMockDbSet();
        var mockContext = Substitute.For<ProjectDbContext>(new DbContextOptionsBuilder<ProjectDbContext>().Options);
        mockContext.Projects.Returns(mockSet);

        var handler = new EditProjectHandler(mockContext);
        var request = new EditProjectRequest
        {
            UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            Name = "Nieuwe naam",
            Description = "Nieuwe beschrijving",
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

        var handler = new EditProjectHandler(mockContext);
        var request = new EditProjectRequest
        {
            UserId = new Guid("FAFED473-E134-4E47-903F-C93551A969A4"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            Name = "Nieuwe naam",
            Description = "Nieuwe beschrijving",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.Unauthorized);
    }

    [Fact]
    public async Task WhenSavingFails_ReturnDatabaseError()
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
        mockContext.SaveChangesAsync().Throws(new NpgsqlException());

        var handler = new EditProjectHandler(mockContext);
        var request = new EditProjectRequest
        {
            UserId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            Name = "Nieuwe naam",
            Description = "Nieuwe beschrijving",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }
}
