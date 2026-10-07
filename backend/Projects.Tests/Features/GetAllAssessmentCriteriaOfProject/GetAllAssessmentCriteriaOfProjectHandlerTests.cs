using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetAllAssessmentCriteriaOfProject;
using Projects.Data;
using Projects.Data.Models;
using Projects.Features.GetAllAssessmentCriteriaOfProject;
using Shared;
using Shouldly;

namespace Projects.Tests.Features.GetAllAssessmentCriteriaOfProject
{
    public class GetAllAssessmentCriteriaOfProjectHandlerTests
    {
        [Fact]
        public async Task WhenProjectHasCriteria_ReturnAllCriteria()
        {
            // Arrange
            var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");
            var criterionId1 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");
            var criterionId2 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197023");

            var criteria = new List<AssessmentCriteria>
        {
            new()
            {
                CriteriaId = criterionId1,
                ProjectId = projectId,
                Criteria = "As a user, I want to login",
            },
            new()
            {
                CriteriaId = criterionId2,
                ProjectId = projectId,
                Criteria = "As a user, I want to logout",
            },
        };

            var mockSet = criteria.BuildMockDbSet();
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Returns(mockSet);

            var handler = new GetAllAssessmentCriteriaOfProjectHandler(mockContext);
            var request = new GetAllAssessmentCriteriaOfProjectQuery { ProjectId = projectId };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeTrue();
            var response = result.Value;
            response.criteriaList.Count.ShouldBe(2);
            response.criteriaList[0].CriterionId.ShouldBe(criterionId1);
            response.criteriaList[0].Criterion.ShouldBe("As a user, I want to login");
            response.criteriaList[1].CriterionId.ShouldBe(criterionId2);
            response.criteriaList[1].Criterion.ShouldBe("As a user, I want to logout");
        }

        [Fact]
        public async Task WhenProjectHasNoCriteria_ReturnEmptyList()
        {
            // Arrange
            var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");
            var criteria = new List<AssessmentCriteria>();

            var mockSet = criteria.BuildMockDbSet();
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Returns(mockSet);

            var handler = new GetAllAssessmentCriteriaOfProjectHandler(mockContext);
            var request = new GetAllAssessmentCriteriaOfProjectQuery { ProjectId = projectId };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeTrue();
            var response = result.Value;
            response.criteriaList.Count.ShouldBe(0);
        }

        [Fact]
        public async Task WhenRetrievingFails_ReturnDatabaseError()
        {
            // Arrange
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Throws(new NpgsqlException());

            var handler = new GetAllAssessmentCriteriaOfProjectHandler(mockContext);
            var request = new GetAllAssessmentCriteriaOfProjectQuery
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
        public async Task WhenDatabaseThrowsDbUpdateException_ReturnDatabaseError()
        {
            // Arrange
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Throws(new DbUpdateException());

            var handler = new GetAllAssessmentCriteriaOfProjectHandler(mockContext);
            var request = new GetAllAssessmentCriteriaOfProjectQuery
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
        public async Task WhenDatabaseThrowsInvalidOperationException_ReturnDatabaseError()
        {
            // Arrange
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Throws(new InvalidOperationException());

            var handler = new GetAllAssessmentCriteriaOfProjectHandler(mockContext);
            var request = new GetAllAssessmentCriteriaOfProjectQuery
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
        public async Task WhenRetrievingCriteriaForSpecificProject_ReturnOnlyCriteriaForThatProject()
        {
            // Arrange
            var projectId1 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");
            var projectId2 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197026");
            var criterionId1 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");
            var criterionId2 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197023");
            var criterionId3 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197022");

            var criteria = new List<AssessmentCriteria>
        {
            new()
            {
                CriteriaId = criterionId1,
                ProjectId = projectId1,
                Criteria = "Criterion 1",
            },
            new()
            {
                CriteriaId = criterionId2,
                ProjectId = projectId1,
                Criteria = "Criterion 2",
            },
            new()
            {
                CriteriaId = criterionId3,
                ProjectId = projectId2,
                Criteria = "Criterion 3",
            },
        };

            var mockSet = criteria.BuildMockDbSet();
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Returns(mockSet);

            var handler = new GetAllAssessmentCriteriaOfProjectHandler(mockContext);
            var request = new GetAllAssessmentCriteriaOfProjectQuery { ProjectId = projectId1 };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeTrue();
            var response = result.Value;
            response.criteriaList.Count.ShouldBe(2);
            response.criteriaList.ShouldAllBe(c => c.CriterionId == criterionId1 || c.CriterionId == criterionId2);
        }
    }
}
