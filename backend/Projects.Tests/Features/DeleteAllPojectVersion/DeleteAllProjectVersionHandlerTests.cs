using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using Projects.Data;
using Projects.Data.Models;
using Projects.Features.DeleteAllProjectVersions;
using Shared;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Text;
using Traces.Contracts.Features.DeleteAllTracesOfVersion;

namespace Projects.Tests.Features.DeleteAllPojectVersion
{
    public class DeleteAllProjectVersionHandlerTests
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
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.Versions.Returns(mockSet);

            var mockMediator = Substitute.For<IMediator>();
            var handler = new DeleteAllProjectVersionsHandler(
                mockContext,
                mockMediator
            );
            var request = new DeleteAllProjectVersionRequest { ProjectId = projectId };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeTrue();
        }

        [Fact]
        public async Task WhenDeletingVersionsThrows_ReturnDatabaseError()
        {
            // Arrange
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.Versions.Returns(_ => throw new InvalidOperationException("Database failure"));

            var mockMediator = Substitute.For<IMediator>();
            var handler = new DeleteAllProjectVersionsHandler(
                mockContext,
                mockMediator
            );
            var request = new DeleteAllProjectVersionRequest { ProjectId = Guid.NewGuid() };

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
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.Versions.Returns(mockSet);

            var mockMediator = Substitute.For<IMediator>();
            var handler = new DeleteAllProjectVersionsHandler(
                mockContext,
                mockMediator
            );
            var request = new DeleteAllProjectVersionRequest { ProjectId = Guid.NewGuid() };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.NoChanges);
        }
    }
}
