using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetProject;
using Shared;
using Shouldly;
using Traces.Data;
using Traces.Data.Models;
using Traces.Features.DeleteTraceCollection;

namespace Traces.Tests.Features.DeleteTraceCollection
{
    public class DeleteTraceCollectionHandlerTests
    {
        private readonly Guid _projectId = Guid.NewGuid();
        private readonly Guid _traceCollectionId = Guid.NewGuid();
        private readonly Guid _userId = Guid.NewGuid();

        private IMediator CreateMockMediator(ErrorCode? errorCode = null)
        {
            var mediator = Substitute.For<IMediator>();

            // Default to successful responses unless explicitly overridden by the test
            Result<GetProjectQuery> defaultProjectResult = errorCode is null
                ? new GetProjectQuery { ProjectId = _projectId, UserId = _userId }
                : errorCode.Value;

            mediator
                .Send(Arg.Any<GetProjectResponse>(), Arg.Any<CancellationToken>())
                .Returns(defaultProjectResult);
            mediator
                .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
                .Returns(CreateProjectResponse(_projectId));

            return mediator;
        }

        [Fact]
        public async Task WhenRequestIsValid_DeleteTraceCollection()
        {
            // Arrange

            var traceCollections = new List<TraceCollection>{
                new()
                    { 
                        TraceCollectionId = _traceCollectionId,
                        ProjectVersionId = new Guid("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                        Name = "TestTraceCollection",
                        CreatedAt = DateTime.UtcNow,
                        Traces = new List<Trace>(),
                    },
                };
            var mockContext = Substitute.For<TracesDbContext>(new DbContextOptionsBuilder<TracesDbContext>().Options);
            var mockMediator = CreateMockMediator(); // Uses default success setup

            var handler = new DeleteTraceCollectionHandler(mockContext, mockMediator);
            var request = new DeleteTraceCollectionRequest
            {
                ProjectId = _projectId,
                TraceCollectionId = _traceCollectionId,
                UserId = _userId,
            };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeTrue();
        }

        [Fact]
        public async Task WhenRequestIsInvalid_ReturnsError()
        {
            // Arrange
            var mockContext = Substitute.For<TracesDbContext>(new DbContextOptionsBuilder<TracesDbContext>().Options);
            var mockMediator = CreateMockMediator(ErrorCode.InvalidRequest);

            var handler = new DeleteTraceCollectionHandler(mockContext, mockMediator);
            var request = new DeleteTraceCollectionRequest
            {
                ProjectId = _projectId,
                TraceCollectionId = _traceCollectionId,
                UserId = _userId,
            };

            // Act
            var result = await handler.Handle(request, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeFalse();
        }

        [Fact]
        public async Task WhenProjectNotFound_ReturnsEntityNotFound()
        {
            // Arrange
            var mockContext = Substitute.For<TracesDbContext>(new DbContextOptionsBuilder<TracesDbContext>().Options);
            var mockMediator = CreateMockMediator(ErrorCode.EntityNotFound);
            var handler = new DeleteTraceCollectionHandler(mockContext, mockMediator);
            var request = new DeleteTraceCollectionRequest
            {
                ProjectId = _projectId,
                TraceCollectionId = _traceCollectionId,
                UserId = _userId,
            };
            // Act
            var result = await handler.Handle(request, CancellationToken.None);
            // Assert
            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        }

        [Fact]
        public async Task WhenTraceCollectionNotFound_ReturnsEntityNotFound()
        {
            // Arrange
            var mockContext = Substitute.For<TracesDbContext>(new DbContextOptionsBuilder<TracesDbContext>().Options);
            var mockMediator = CreateMockMediator();
            var handler = new DeleteTraceCollectionHandler(mockContext, mockMediator);
            var request = new DeleteTraceCollectionRequest
            {
                ProjectId = _projectId,
                TraceCollectionId = Guid.NewGuid(), // Non-existent TraceCollectionId
                UserId = _userId,
            };
            // Act
            var result = await handler.Handle(request, CancellationToken.None);
            // Assert
            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        }

        private static GetProjectResponse CreateProjectResponse(Guid projectId)
        {
            return new GetProjectResponse
            {
                ProjectId = projectId,
                Name = "Project Name",
                Description = "Project Description",
                Versions = [],
                AssessmentCriteria = [],
            };
        }

    }
}
