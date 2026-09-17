using AssessmentCriteria.Contracts.Features.InternalGetAllAssessmentCriteriaOfProject;
using AssessmentCriteria.Data;
using AssessmentCriteria.Data.Models;
using AssessmentCriteria.Features.InternalGetAllAssessmentCriteriaOfProject;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Shared;
using Shouldly;

namespace AssessmentCriteria.Tests.Features.GetAllAssessmentCriteriaOfProject;

public class InternalGetAllAssessmentCriteriaOfProjectHandlerTests
{
    [Fact]
    public async Task WhenProjectHasCriteria_ReturnAllCriteria()
    {
        // Arrange
        var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");
        var criterionId1 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");
        var criterionId2 = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197023");

        var criteria = new List<AssessmentCriterion>
        {
            new()
            {
                CriterionId = criterionId1,
                ProjectId = projectId,
                Criterion = "As a user, I want to login",
            },
            new()
            {
                CriterionId = criterionId2,
                ProjectId = projectId,
                Criterion = "As a user, I want to logout",
            },
        };

        var mockSet = criteria.BuildMockDbSet();
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Returns(mockSet);

        var handler = new InternalGetAllAssessmentCriteriaOfProjectHandler(mockContext);
        var request = new InternalGetAllAssessmentCriteriaOfProjectQuery { ProjectId = projectId };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var response = result.Value;
        response.CriteriaList.Count.ShouldBe(2);
        response.CriteriaList[0].CriterionId.ShouldBe(criterionId1);
        response.CriteriaList[0].Criterion.ShouldBe("As a user, I want to login");
        response.CriteriaList[1].CriterionId.ShouldBe(criterionId2);
        response.CriteriaList[1].Criterion.ShouldBe("As a user, I want to logout");
    }

    [Fact]
    public async Task WhenProjectHasNoCriteria_ReturnEmptyList()
    {
        // Arrange
        var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");
        var criteria = new List<AssessmentCriterion>();

        var mockSet = criteria.BuildMockDbSet();
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Returns(mockSet);

        var handler = new InternalGetAllAssessmentCriteriaOfProjectHandler(mockContext);
        var request = new InternalGetAllAssessmentCriteriaOfProjectQuery { ProjectId = projectId };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var response = result.Value;
        response.CriteriaList.Count.ShouldBe(0);
    }

    [Fact]
    public async Task WhenRetrievingFails_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Throws(new NpgsqlException());

        var handler = new InternalGetAllAssessmentCriteriaOfProjectHandler(mockContext);
        var request = new InternalGetAllAssessmentCriteriaOfProjectQuery
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
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Throws(new DbUpdateException());

        var handler = new InternalGetAllAssessmentCriteriaOfProjectHandler(mockContext);
        var request = new InternalGetAllAssessmentCriteriaOfProjectQuery
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
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Throws(new InvalidOperationException());

        var handler = new InternalGetAllAssessmentCriteriaOfProjectHandler(mockContext);
        var request = new InternalGetAllAssessmentCriteriaOfProjectQuery
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

        var criteria = new List<AssessmentCriterion>
        {
            new()
            {
                CriterionId = criterionId1,
                ProjectId = projectId1,
                Criterion = "Criterion 1",
            },
            new()
            {
                CriterionId = criterionId2,
                ProjectId = projectId1,
                Criterion = "Criterion 2",
            },
            new()
            {
                CriterionId = criterionId3,
                ProjectId = projectId2,
                Criterion = "Criterion 3",
            },
        };

        var mockSet = criteria.BuildMockDbSet();
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Returns(mockSet);

        var handler = new InternalGetAllAssessmentCriteriaOfProjectHandler(mockContext);
        var request = new InternalGetAllAssessmentCriteriaOfProjectQuery { ProjectId = projectId1 };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var response = result.Value;
        response.CriteriaList.Count.ShouldBe(2);
        response.CriteriaList.ShouldAllBe(c => c.CriterionId == criterionId1 || c.CriterionId == criterionId2);
    }
}
