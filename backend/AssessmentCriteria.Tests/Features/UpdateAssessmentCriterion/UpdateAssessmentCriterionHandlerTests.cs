using AssessmentCriteria.Data;
using AssessmentCriteria.Data.Models;
using AssessmentCriteria.Features.UpdateAssessmentCriterion;
using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetProject;
using Shared;
using Shouldly;

namespace AssessmentCriteria.Tests.Features.UpdateAssessmentCriterion;

public class UpdateAssessmentCriterionHandlerTests
{
    private static IMediator CreateMediatorMock(ErrorCode? errorCode = null)
    {
        var mediator = Substitute.For<IMediator>();
        Result<GetProjectResponse> result = errorCode is null
            ? new GetProjectResponse
            {
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                Name = "TestProject",
                Description = "TestDescription",
                Versions = [],
                AssessmentCriteria = [],
            }
            : errorCode.Value;

        mediator.Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>()).Returns(result);

        return mediator;
    }

    [Fact]
    public async Task WhenRequestIsValid_UpdateAssessmentCriterion()
    {
        // Arrange
        var criterionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");
        var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");

        var criteria = new List<AssessmentCriterion>
        {
            new()
            {
                CriterionId = criterionId,
                ProjectId = projectId,
                Criterion = "As a user, I want to login",
            },
        };

        var mockSet = criteria.BuildMockDbSet();
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var handler = new UpdateAssessmentCriterionHandler(mockContext, CreateMediatorMock());
        var request = new UpdateAssessmentCriterionRequest
        {
            UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
            ProjectId = projectId,
            CriterionId = criterionId,
            Criterion = "As a user, I want to login securely",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var response = result.Value;
        response.CriterionId.ShouldBe(criterionId);
        response.ProjectId.ShouldBe(projectId);
        response.Criterion.ShouldBe(request.Criterion);
    }

    [Fact]
    public async Task WhenProjectDoesNotExist_ReturnProjectErrorCode()
    {
        // Arrange
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );

        var handler = new UpdateAssessmentCriterionHandler(mockContext, CreateMediatorMock(ErrorCode.EntityNotFound));
        var request = new UpdateAssessmentCriterionRequest
        {
            UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025"),
            CriterionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            Criterion = "As a user, I want to login securely",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenCriterionDoesNotExist_ReturnNotFoundError()
    {
        // Arrange
        var criteria = new List<AssessmentCriterion>();

        var mockSet = criteria.BuildMockDbSet();
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Returns(mockSet);

        var handler = new UpdateAssessmentCriterionHandler(mockContext, CreateMediatorMock());
        var request = new UpdateAssessmentCriterionRequest
        {
            UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025"),
            CriterionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            Criterion = "As a user, I want to login securely",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
    }

    [Fact]
    public async Task WhenRetrievingCriterionFails_ReturnDatabaseError()
    {
        // Arrange
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Throws(new NpgsqlException());

        var handler = new UpdateAssessmentCriterionHandler(mockContext, CreateMediatorMock());
        var request = new UpdateAssessmentCriterionRequest
        {
            UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
            ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025"),
            CriterionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            Criterion = "As a user, I want to login securely",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenSavingFails_ReturnDatabaseError()
    {
        // Arrange
        var criterionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");
        var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");

        var criteria = new List<AssessmentCriterion>
        {
            new()
            {
                CriterionId = criterionId,
                ProjectId = projectId,
                Criterion = "As a user, I want to login",
            },
        };

        var mockSet = criteria.BuildMockDbSet();
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Throws(new NpgsqlException());

        var handler = new UpdateAssessmentCriterionHandler(mockContext, CreateMediatorMock());
        var request = new UpdateAssessmentCriterionRequest
        {
            UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
            ProjectId = projectId,
            CriterionId = criterionId,
            Criterion = "As a user, I want to login securely",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenSavingFailsWithDbUpdateException_ReturnDatabaseError()
    {
        // Arrange
        var criterionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");
        var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");

        var criteria = new List<AssessmentCriterion>
        {
            new()
            {
                CriterionId = criterionId,
                ProjectId = projectId,
                Criterion = "As a user, I want to login",
            },
        };

        var mockSet = criteria.BuildMockDbSet();
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Throws(new DbUpdateException());

        var handler = new UpdateAssessmentCriterionHandler(mockContext, CreateMediatorMock());
        var request = new UpdateAssessmentCriterionRequest
        {
            UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
            ProjectId = projectId,
            CriterionId = criterionId,
            Criterion = "As a user, I want to login securely",
        };

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
    }

    [Fact]
    public async Task WhenRequestIsValid_CallGetProjectQuery()
    {
        // Arrange
        var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");
        var userId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED");
        var criterionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");

        var criteria = new List<AssessmentCriterion>
        {
            new()
            {
                CriterionId = criterionId,
                ProjectId = projectId,
                Criterion = "As a user, I want to login",
            },
        };

        var mockSet = criteria.BuildMockDbSet();
        var mockContext = Substitute.For<AssessmentCriteriaDbContext>(
            new DbContextOptionsBuilder<AssessmentCriteriaDbContext>().Options
        );
        mockContext.AssessmentCriteria.Returns(mockSet);
        mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        var mediator = CreateMediatorMock();
        var handler = new UpdateAssessmentCriterionHandler(mockContext, mediator);
        var request = new UpdateAssessmentCriterionRequest
        {
            UserId = userId,
            ProjectId = projectId,
            CriterionId = criterionId,
            Criterion = "As a user, I want to login securely",
        };

        // Act
        _ = await handler.Handle(request, CancellationToken.None);

        // Assert
        await mediator
            .Received(1)
            .Send(
                Arg.Is<GetProjectQuery>(r => r.ProjectId == projectId && r.UserId == userId),
                Arg.Any<CancellationToken>()
            );
    }
}
