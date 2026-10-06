using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Projects.Contracts.Features.GetAllProjectVersions;
using Projects.Contracts.Features.GetProject;
using Shared;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Traces.Data;
using Traces.Data.Models;
using Traces.Features.EditOpenCode;
using Xunit;

namespace Traces.Tests.Features.EditOpenCode
{
    public class EditOpenCodeHandlerTests
    {
        Guid _traceId = Guid.NewGuid();
        Guid _traceCollectionId = Guid.NewGuid();
        Guid _userId = Guid.NewGuid();
        Guid _projectId = Guid.NewGuid();
        Guid _projectVersionId = Guid.NewGuid();

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
        public async Task WhenRequestIsValid_EditOpenCode()
        {
            //arrange
            var traceCollection = new TraceCollection{
                        TraceCollectionId = _traceCollectionId,
                        ProjectVersionId = _projectVersionId,
                        Name = "TestTraceCollection",
                        CreatedAt = DateTime.UtcNow,
                        Traces = new List<Trace>(),
                };

            var traces = new List<Trace> {
                new() {
                    TraceId = _traceId,
                    TraceCollectionId = _traceCollectionId,
                    TraceCollection = traceCollection,
                    TraceGroupId = null,
                    UpdatedAt = DateTime.UtcNow,
                    TraceScopes = new List<TraceScope>(),
                    TraceResources = new List<TraceResource>(),
                    OpenCode = "OldOpenCode",
                },
            };

            var mockSet = traces.BuildMockDbSet();
            var mockContext = Substitute.For<TracesDbContext>(new DbContextOptionsBuilder<TracesDbContext>().Options);
            mockContext.Traces.Returns(mockSet);

            var mediator = CreateMockMediator();

            var handler = new EditOpenCodeHandler(mockContext, mediator);
            var request = new EditOpencodeRequest
            {
                TraceId = _traceId,
                ProjectId = _projectId,
                ProjectVersionId = _projectVersionId,
                OpenCode = "NewOpenCode",
                UserId = _userId
            };

            //act

            var result = await handler.Handle(request, CancellationToken.None);

            //assert

            result.IsSuccess.ShouldBeTrue();
            var updatedTrace = await mockContext.Traces.FirstOrDefaultAsync(t => t.TraceId == _traceId);
            
            updatedTrace.OpenCode.ShouldBe("NewOpenCode");

        }

        [Fact]
        public async Task WhenTraceDoesNotExist_ReturnNotFoundError()
        {
            // Arrange
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
                    TraceId = _traceId,
                    TraceCollectionId = _traceCollectionId,
                    TraceCollection = traceCollection,
                    TraceGroupId = null,
                    UpdatedAt = DateTime.UtcNow,
                    TraceScopes = new List<TraceScope>(),
                    TraceResources = new List<TraceResource>(),
                    OpenCode = "OldOpenCode",
                },
            };

            var mockSet = traces.BuildMockDbSet();
            var mockContext = Substitute.For<TracesDbContext>(new DbContextOptionsBuilder<TracesDbContext>().Options);
            mockContext.Traces.Returns(mockSet);

            var mediator = CreateMockMediator();

            var handler = new EditOpenCodeHandler(mockContext, mediator);
            var request = new EditOpencodeRequest
            {
                TraceId = Guid.NewGuid(),
                ProjectId = _projectId,
                ProjectVersionId = _projectVersionId,
                OpenCode = "NewOpenCode",
                UserId = _userId
            };

            // Act

            var result = await handler.Handle(request, CancellationToken.None);

            // Assert

            result.IsError.ShouldBeTrue();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        }

        [Fact]
        public async Task WhenSavingFails_ReturnDatabaseError()
        {
            //arrange
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
                    TraceId = _traceId,
                    TraceCollectionId = _traceCollectionId,
                    TraceCollection = traceCollection,
                    TraceGroupId = null,
                    UpdatedAt = DateTime.UtcNow,
                    TraceScopes = new List<TraceScope>(),
                    TraceResources = new List<TraceResource>(),
                    OpenCode = "OldOpenCode",
                },
            };

            var mockSet = traces.BuildMockDbSet();
            var mockContext = Substitute.For<TracesDbContext>(new DbContextOptionsBuilder<TracesDbContext>().Options);
            mockContext.Traces.Returns(mockSet);
            mockContext.SaveChangesAsync().Throws(new NpgsqlException());

            var mediator = CreateMockMediator();

            var handler = new EditOpenCodeHandler(mockContext, mediator);
            var request = new EditOpencodeRequest
            {
                TraceId = _traceId,
                ProjectId = _projectId,
                ProjectVersionId = _projectVersionId,
                OpenCode = "NewOpenCode",
                UserId = _userId
            };

            //act

            var result = await handler.Handle(request, CancellationToken.None);

            //assert

            result.IsError.ShouldBeTrue();
            result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
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
