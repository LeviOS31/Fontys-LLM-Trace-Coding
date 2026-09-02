using Microsoft.EntityFrameworkCore;
using NSubstitute;
using ProjectVersions.Contracts.Features.InternalGetProjectVersions;
using ProjectVersions.Data;
using ProjectVersions.Data.Models;
using ProjectVersions.Features.InternalGetProjectVersions;
using Shared;
using Shouldly;

namespace ProjectVersions.Tests.Features.GetProjectVersions;

public class InternalGetProjectVersionsHandlerTests
{
    private static ProjectVersionsDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ProjectVersionsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ProjectVersionsDbContext(options);
    }

    [Fact]
    public async Task WhenVersionsExist_ReturnOnlyMatchingProjectVersions()
    {
        // Arrange
        var projectId = Guid.NewGuid();
        var otherProjectId = Guid.NewGuid();

        await using var context = CreateContext();
        context.Versions.AddRange(
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
            new ProjectVersion
            {
                VersionId = Guid.NewGuid(),
                ProjectId = otherProjectId,
                Name = "other",
                Description = "Other project",
            }
        );
        await context.SaveChangesAsync();

        var handler = new InternalGetProjectVersionsHandler(context);
        var query = new InternalGetProjectVersionsQuery { ProjectId = projectId };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Versions.Count.ShouldBe(2);
        result.Value.Versions.All(v => v.ProjectId == projectId).ShouldBeTrue();
        result.Value.Versions.Any(v => v.Name == "v1" && v.Description == "First").ShouldBeTrue();
        result.Value.Versions.Any(v => v.Name == "v2" && v.Description == "Second").ShouldBeTrue();
    }

    [Fact]
    public async Task WhenNoVersionsExist_ReturnEmptyList()
    {
        // Arrange
        await using var context = CreateContext();
        var handler = new InternalGetProjectVersionsHandler(context);
        var query = new InternalGetProjectVersionsQuery { ProjectId = Guid.NewGuid() };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Versions.ShouldBeEmpty();
    }

    [Fact]
    public async Task WhenDatabaseQueryThrows_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<ProjectVersionsDbContext>(
            new DbContextOptionsBuilder<ProjectVersionsDbContext>().Options
        );
        mockContext.Versions.Returns(_ => throw new InvalidOperationException("Database failure"));

        var handler = new InternalGetProjectVersionsHandler(mockContext);
        var query = new InternalGetProjectVersionsQuery { ProjectId = Guid.NewGuid() };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }
}
