using AssessmentCriteria.Contracts.Features.InternalDeleteAllAssessmentCriteriaOfProject;
using AssessmentCriteria.Data;
using AssessmentCriteria.Data.Models;
using AssessmentCriteria.Features.InternalDeleteAllAssessmentCriteriaOfProject;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Shared;
using Shouldly;

namespace AssessmentCriteria.Tests.Features.DeleteAllAssessmentCriteriaOfProject;

public class InternalDeleteAllAssessmentCriteriaOfProjectHandlerTests
{
    [Fact]
    public async Task WhenRequestIsValid_DeleteAllAssessmentCriteriaOfProject()
    {
        // Arrange
        var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");
        var criteria = new List<AssessmentCriterion>
        {
            new()
            {
                CriterionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197021"),
                ProjectId = projectId,
                Criterion = "Criterion 1",
            },
            new()
            {
                CriterionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197022"),
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197023"),
                Criterion = "Criterion 2",
            },
        };

        var mockSet = criteria.BuildMockDbSet();
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Returns(mockSet);

        var handler = new InternalDeleteAllAssessmentCriteriaOfProjectHandler(mockContext);
        var request = new InternalDeleteAllAssessmentCriteriaOfProjectRequest { ProjectId = projectId };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task WhenProjectHasNoAssessmentCriteria_ReturnNoChangesError()
    {
        // Arrange
        var criteria = new List<AssessmentCriterion>();
        var mockSet = criteria.BuildMockDbSet();
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Returns(mockSet);

        var handler = new InternalDeleteAllAssessmentCriteriaOfProjectHandler(mockContext);
        var request = new InternalDeleteAllAssessmentCriteriaOfProjectRequest
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
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Throws(new NpgsqlException());

        var handler = new InternalDeleteAllAssessmentCriteriaOfProjectHandler(mockContext);
        var request = new InternalDeleteAllAssessmentCriteriaOfProjectRequest
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
