using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using Projects.Contracts.Features.GetAllProjectVersions;
using Projects.Contracts.Features.GetProject;
using Shared;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Text;
using Traces.Contracts.Features.GetTrace;
using Traces.Data;
using Traces.Data.Models;
using Traces.Features.GetTrace;

namespace Traces.Tests.Features.GetTrace
{
    public class GetTraceHandlerTests
    {
        Guid _traceId1 = Guid.NewGuid();
        Guid _traceId2 = Guid.NewGuid();
        Guid _traceCollectionId = Guid.NewGuid();
        Guid _userId = Guid.NewGuid();
        Guid _projectId = Guid.NewGuid();
        Guid _projectVersionId = Guid.NewGuid();

        private TracesDbContext CreateContext()
        {
            var traceCollection = new TraceCollection
            {
                TraceCollectionId = _traceCollectionId,
                ProjectVersionId = _projectVersionId,
                Name = "TestTraceCollection",
                CreatedAt = DateTime.UtcNow,
                Traces = new List<Trace>(),
            };

            var traces = new List<Trace> {
                new() {
                    TraceId = _traceId1,
                    TraceCollectionId = _traceCollectionId,
                    TraceCollection = traceCollection,
                    TraceGroupId = null,
                    UpdatedAt = DateTime.UtcNow,
                    TraceScopes = new List<TraceScope>(),
                    TraceResources = new List<TraceResource>(),
                    OpenCode = "OpenCode1",
                },
                new() {
                    TraceId = _traceId2,
                    TraceCollectionId = _traceCollectionId,
                    TraceCollection = traceCollection,
                    TraceGroupId = null,
                    UpdatedAt = DateTime.UtcNow,
                    TraceScopes = new List<TraceScope>(),
                    TraceResources = new List<TraceResource>(),
                    OpenCode = "OpenCode2",
                }
            };

            var mockset = traces.BuildMockDbSet();
            var mockContext = Substitute.For<TracesDbContext>(new DbContextOptionsBuilder<TracesDbContext>().Options);
            mockContext.Traces.Returns(mockset);
            return mockContext;
        }

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
        public async Task WhenTraceExists_ReturnsTrace()
        {
            // Arrange
            var context = CreateContext();
            var mediator = CreateMockMediator();

            var handler = new GetTraceHandler(context, mediator);

            // Act
            var result = await handler.Handle(new GetTraceQuery { TraceId = _traceId1, ProjectVersionId = _projectVersionId }, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeTrue();
            result.ErrorCode.ShouldBeNull();
            result.Value.TraceId.ShouldBe(_traceId1);
        }

        [Fact]
        public async Task WhenTraceDoesNotExist_ReturnEntityNotFound()
        {
            // Arrange
            var context = CreateContext();
            var mediator = CreateMockMediator();

            var handler = new GetTraceHandler(context, mediator);

            // Act
            var result = await handler.Handle(new GetTraceQuery { TraceId = Guid.NewGuid(), ProjectVersionId = _projectVersionId }, CancellationToken.None);

            // Assert
            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        }

        private GetProjectResponse CreateProjectResponse(Guid projectId)
        {
            return new GetProjectResponse
            {
                ProjectId = projectId,
                Name = "Project Name",
                Description = "Project Description",
                Versions = [new GetAllProjectVersionsResponse.ProjectVersionSummary { VersionId = _projectVersionId, Name = "Version 1", Description = "Version 1 Description", ProjectId = projectId }],
                AssessmentCriteria = [],
            };
        }

    }
}
