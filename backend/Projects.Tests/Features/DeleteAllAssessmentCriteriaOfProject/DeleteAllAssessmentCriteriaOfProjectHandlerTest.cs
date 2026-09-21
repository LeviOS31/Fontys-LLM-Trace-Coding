using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Data;
using Projects.Data.Models;
using Projects.Features.DeleteAllAssessmentCriteriaOfProject;
using Shared;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Text;

namespace Projects.Tests.Features.DeleteAllAssessmentCriteriaOfProject
{
    public class DeleteAllAssessmentCriteriaOfProjectHandlerTest
    {
        [Fact]
        public async Task WhenRequestIsValid_DeleteAllAssessmentCriteriaOfProject()
        {
            // Arrange
            var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");
            var criteria = new List<AssessmentCriteria>
        {
            new()
            {
                CriteriaId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197021"),
                ProjectId = projectId,
                Criteria = "Criterion 1",
            },
            new()
            {
                CriteriaId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197022"),
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197023"),
                Criteria = "Criterion 2",
            },
        };

            var mockSet = criteria.BuildMockDbSet();
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Returns(mockSet);

            var mockMediator = Substitute.For<IMediator>();
            var handler = new DeleteAllAssessmentCriteriaOfProjectHandler( mockContext, mockMediator);
            var request = new DeleteAllAssessmentCriteriaOfProjectRequest { ProjectId = projectId };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeTrue();
        }

        [Fact]
        public async Task WhenProjectHasNoAssessmentCriteria_ReturnNoChangesError()
        {
            // Arrange
            var criteria = new List<AssessmentCriteria>();
            var mockSet = criteria.BuildMockDbSet();
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Returns(mockSet);

            var mockMediator = Substitute.For<IMediator>();
            var handler = new DeleteAllAssessmentCriteriaOfProjectHandler(mockContext, mockMediator);
            var request = new DeleteAllAssessmentCriteriaOfProjectRequest
            {
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.NoChanges);
        }

        [Fact]
        public async Task WhenDeletingThrowsDbException_ReturnDatabaseError()
        {
            // Arrange
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Throws(new NpgsqlException());

            var mockMediator = Substitute.For<IMediator>();
            var handler = new DeleteAllAssessmentCriteriaOfProjectHandler(mockContext, mockMediator);
            var request = new DeleteAllAssessmentCriteriaOfProjectRequest
            {
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
        }
    }
}
