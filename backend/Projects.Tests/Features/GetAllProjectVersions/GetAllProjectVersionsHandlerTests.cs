using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetAllAssessmentCriteriaOfProject;
using Projects.Contracts.Features.GetAllProjectVersions;
using Projects.Data;
using Projects.Data.Models;
using Projects.Features.GetAllAssessmentCriteriaOfProject;
using Projects.Features.GetAllProjects;
using Projects.Features.GetProjectVersions;
using Shared;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Text;

namespace Projects.Tests.Features.GetAllProjectVersions
{
    public class GetAllProjectVersionsHandlerTests
    {
        [Fact]
        public async Task WhenProjectHasVersions_ReturnAllVersions()
        {
            // Arrange
            var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");
            var versionId1 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");
            var versionId2 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197023");
            var versions = new List<ProjectVersion>
            {
                new()
                {
                    VersionId = versionId1,
                    ProjectId = projectId,
                    Name = "1.0.0",
                    Description = "Initial release"
                },
                new()
                {
                    VersionId = versionId2,
                    ProjectId = projectId,
                    Name = "1.1.0",
                    Description = "Minor update"
                },
            };
            var mockSet = versions.BuildMockDbSet();
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.Versions.Returns(mockSet);

            var mediator = Substitute.For<IMediator>();
            var handler = new GetProjectVersionsHandler(mediator, mockContext);
            var request = new GetAllProjectVersionsQuery { ProjectId = projectId };
            // Act
            var result = await handler.Handle(request, CancellationToken.None);
            // Assert
            result.IsSuccess.ShouldBeTrue();
            var response = result.Value;
            response.Versions.Count.ShouldBe(2);
            response.Versions[0].VersionId.ShouldBe(versionId1);
            response.Versions[0].Name.ShouldBe("1.0.0");
            response.Versions[1].VersionId.ShouldBe(versionId2);
            response.Versions[1].Name.ShouldBe("1.1.0");
        }

        [Fact]
        public async Task WhenProjectHasNoVersions_ReturnEmptyList()
        {
            //Arrange
            var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");
            var versions = new List<ProjectVersion>();

            var mockSet = versions.BuildMockDbSet();
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.Versions.Returns(mockSet);

            var mediator = Substitute.For<IMediator>();
            var handler = new GetProjectVersionsHandler(mediator, mockContext);
            var request = new GetAllProjectVersionsQuery { ProjectId = projectId };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeTrue();
            var response = result.Value;
            response.Versions.Count.ShouldBe(0);
        }

        [Fact]
        public async Task WhenRetrievingFails_ReturnDatabaseError()
        {
            // Arrange
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.Versions.Throws(new NpgsqlException());

            var mediator = Substitute.For<IMediator>();
            var handler = new GetProjectVersionsHandler(mediator, mockContext);
            var request = new GetAllProjectVersionsQuery
            {
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025"),
            };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
        }

        [Fact]
        public async Task WhenRetrievingVersionsForSpecificProject_ReturnOnlyVersionsForThatProject()
        {
            // Arrange
            var projectId1 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");
            var projectId2 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197026");
            var versions = new List<ProjectVersion>
            {
                new()
                {
                    VersionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                    ProjectId = projectId1,
                    Name = "1.0.0",
                    Description = "Initial release"
                },
                new()
                {
                    VersionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197023"),
                    ProjectId = projectId2,
                    Name = "1.1.0",
                    Description = "Minor update"
                },
            };
            var mockSet = versions.BuildMockDbSet();
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.Versions.Returns(mockSet);
            var mediator = Substitute.For<IMediator>();
            var handler = new GetProjectVersionsHandler(mediator, mockContext);
            var request = new GetAllProjectVersionsQuery { ProjectId = projectId1 };
            // Act
            var result = await handler.Handle(request, CancellationToken.None);
            // Assert
            result.IsSuccess.ShouldBeTrue();
            var response = result.Value;
            response.Versions.Count.ShouldBe(1);
            response.Versions[0].ProjectId.ShouldBe(projectId1);
        }
    }
}
