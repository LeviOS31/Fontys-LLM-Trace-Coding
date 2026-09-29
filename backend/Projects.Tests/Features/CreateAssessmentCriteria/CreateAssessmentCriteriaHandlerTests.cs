using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetProject;
using Projects.Data;
using Projects.Data.Models;
using Projects.Features.CreateAssessmentCriteria;
using Projects.Features.CreateProject;
using Shared;
using Shouldly;

namespace Projects.Tests.Features.CreateAssessmentCriteria
{
    public class CreateAssessmentCriteriaHandlerTests
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
        public async Task WhenRequestIsValid_CreateAssessmentCriterion()
        {
            // Arrange
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

            var handler = new CreateAssessmentCriteriaHandler(mockContext, CreateMediatorMock());
            var request = new CreateAssessmentCriteriaRequest
            {
                UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                Criteria = "As a user, I want to login",
            };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeTrue();
            var response = result.Value;
            response.CriteriaId.ShouldNotBe(Guid.Empty);
            response.ProjectId.ShouldBe(request.ProjectId);
            response.Criteria.ShouldBe(request.Criteria);
        }

        [Fact]
        public async Task WhenProjectDoesNotExist_ReturnProjectErrorCode()
        {
            // Arrange
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );

            var handler = new CreateAssessmentCriteriaHandler(mockContext, CreateMediatorMock(ErrorCode.EntityNotFound));
            var request = new CreateAssessmentCriteriaRequest
            {
                UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                Criteria = "As a user, I want to login",
            };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        }

        [Fact]
        public async Task WhenDatabaseFails_ReturnDatabaseError()
        {
            // Arrange
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Throws(new NpgsqlException());

            var handler = new CreateAssessmentCriteriaHandler(mockContext, CreateMediatorMock());
            var request = new CreateAssessmentCriteriaRequest
            {
                UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                Criteria = "As a user, I want to login",
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
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Throws(new DbUpdateException());

            var handler = new CreateAssessmentCriteriaHandler(mockContext, CreateMediatorMock());
            var request = new CreateAssessmentCriteriaRequest
            {
                UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                Criteria = "As a user, I want to login",
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
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(0);

            var handler = new CreateAssessmentCriteriaHandler(mockContext, CreateMediatorMock());
            var request = new CreateAssessmentCriteriaRequest
            {
                UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                Criteria = "As a user, I want to login",
            };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.NoChanges);
        }
    }
}
