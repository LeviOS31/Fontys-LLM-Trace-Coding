using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetProject;
using Projects.Data;
using Projects.Data.Models;
using Projects.Features.DeleteAllAssessmentCriteriaOfProject;
using Projects.Features.DeleteAssessmentCriteria;
using Shared;
using Shouldly;



namespace Projects.Tests.Features.DeleteAssessmentCriteria
{
    public class DeleteAssessmentCriteriaHandlerTests
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
        public async Task WhenRequestIsValid_DeleteAssessmentCriterion()
        {
            // Arrange
            var criterionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");
            var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");

            var criteria = new List<AssessmentCriteria>
        {
            new()
            {
                CriteriaId = criterionId,
                ProjectId = projectId,
                Criteria = "As a user, I want to login",
            },
        };

            var mockSet = criteria.BuildMockDbSet();
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Returns(mockSet);

            var handler = new DeleteAssessmentCriteriaHandler(mockContext, CreateMediatorMock());
            var request = new DeleteAssessmentCriteriaRequest
            {
                UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
                ProjectId = projectId,
                CriteriaId = criterionId,
            };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeTrue();
        }

        [Fact]
        public async Task WhenProjectDoesNotExist_ReturnProjectErrorCode()
        {
            // Arrange
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );

            var handler = new DeleteAssessmentCriteriaHandler(mockContext, CreateMediatorMock(ErrorCode.EntityNotFound));
            var request = new DeleteAssessmentCriteriaRequest
            {
                UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025"),
                CriteriaId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
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
            var criteria = new List<AssessmentCriteria>();

            var mockSet = criteria.BuildMockDbSet();
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Returns(mockSet);

            var handler = new DeleteAssessmentCriteriaHandler(mockContext, CreateMediatorMock());
            var request = new DeleteAssessmentCriteriaRequest
            {
                UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025"),
                CriteriaId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        }

        [Fact]
        public async Task WhenCheckingExistsFails_ReturnDatabaseError()
        {
            // Arrange
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Throws(new NpgsqlException());

            var handler = new DeleteAssessmentCriteriaHandler(mockContext, CreateMediatorMock());
            var request = new DeleteAssessmentCriteriaRequest
            {
                UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025"),
                CriteriaId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
        }

        [Fact]
        public async Task WhenDeletingFails_ReturnDatabaseError()
        {
            // Arrange
            var criterionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024");
            var projectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025");

            var criteria = new List<AssessmentCriteria>
        {
            new()
            {
                CriteriaId = criterionId,
                ProjectId = projectId,
                Criteria = "As a user, I want to login",
            },
        };

            var mockSet = criteria.BuildMockDbSet();
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Returns(_ => mockSet, _ => throw new InvalidOperationException());

            var handler = new DeleteAssessmentCriteriaHandler(mockContext, CreateMediatorMock());
            var request = new DeleteAssessmentCriteriaRequest
            {
                UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
                ProjectId = projectId,
                CriteriaId = criterionId,
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

            var criteria = new List<AssessmentCriteria>
        {
            new()
            {
                CriteriaId = criterionId,
                ProjectId = projectId,
                Criteria = "As a user, I want to login",
            },
        };

            var mockSet = criteria.BuildMockDbSet();
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Returns(mockSet);

            var mediator = CreateMediatorMock();
            var handler = new DeleteAssessmentCriteriaHandler(mockContext, mediator);
            var request = new DeleteAssessmentCriteriaRequest
            {
                UserId = userId,
                ProjectId = projectId,
                CriteriaId = criterionId,
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

        [Fact]
        public async Task WhenNoChanges_ReturnNoChangesError()
        {
            // Arrange
            var criteria = new List<AssessmentCriteria>
        {
            new()
            {
                CriteriaId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025"),
                Criteria = "As a user, I want to login",
            },
        };

            var mockSet = criteria.BuildMockDbSet();
            var emptyList = new List<AssessmentCriteria>();
            var emptyListMock = emptyList.BuildMockDbSet();
            var mockContext = Substitute.For<ProjectDbContext>(
                new DbContextOptionsBuilder<ProjectDbContext>().Options
            );
            mockContext.AssessmentCriterias.Returns(mockSet, emptyListMock);

            var handler = new DeleteAssessmentCriteriaHandler(mockContext, CreateMediatorMock());
            var request = new DeleteAssessmentCriteriaRequest
            {
                UserId = new Guid("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
                ProjectId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197025"),
                CriteriaId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
            };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.NoChanges);
        }
    }
}
