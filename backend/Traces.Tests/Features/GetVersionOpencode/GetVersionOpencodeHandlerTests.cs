using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using Projects.Contracts.Features.GetAllProjectVersions;
using Projects.Contracts.Features.GetProject;
using Shouldly;
using Shared;
using Traces.Contracts.Features.GetVersionOpencode;
using Traces.Data;
using Traces.Data.Models;
using Traces.Features.GetVersionOpencode;

namespace Traces.Tests.Features.GetVersionOpencode
{
    public class GetVersionOpencodeHandlerTests
    {
        private readonly Guid _traceIdWithOpenCode = Guid.NewGuid();
        private readonly Guid _traceIdWithoutOpenCode = Guid.NewGuid();
        private readonly Guid _traceIdFromOtherVersion = Guid.NewGuid();
        private readonly Guid _traceCollectionId = Guid.NewGuid();
        private readonly Guid _otherTraceCollectionId = Guid.NewGuid();
        private readonly Guid _userId = Guid.NewGuid();
        private readonly Guid _projectId = Guid.NewGuid();
        private readonly Guid _projectVersionId = Guid.NewGuid();
        private readonly Guid _otherProjectVersionId = Guid.NewGuid();

        private TracesDbContext CreateContext()
        {
            var traceCollection = new TraceCollection
            {
                TraceCollectionId = _traceCollectionId,
                ProjectVersionId = _projectVersionId,
                Name = "TestTraceCollection",
                CreatedAt = DateTime.UtcNow,
                Traces = [],
            };

            var otherTraceCollection = new TraceCollection
            {
                TraceCollectionId = _otherTraceCollectionId,
                ProjectVersionId = _otherProjectVersionId,
                Name = "OtherTraceCollection",
                CreatedAt = DateTime.UtcNow,
                Traces = [],
            };

            var traces = new List<Trace>
            {
                new()
                {
                    TraceId = _traceIdWithOpenCode,
                    TraceCollectionId = _traceCollectionId,
                    TraceCollection = traceCollection,
                    UpdatedAt = DateTime.UtcNow,
                    TraceScopes = [],
                    TraceResources = [],
                    OpenCode = "OpenCode1",
                },
                new()
                {
                    TraceId = _traceIdWithoutOpenCode,
                    TraceCollectionId = _traceCollectionId,
                    TraceCollection = traceCollection,
                    UpdatedAt = DateTime.UtcNow,
                    TraceScopes = [],
                    TraceResources = [],
                    OpenCode = null,
                },
                new()
                {
                    TraceId = _traceIdFromOtherVersion,
                    TraceCollectionId = _otherTraceCollectionId,
                    TraceCollection = otherTraceCollection,
                    UpdatedAt = DateTime.UtcNow,
                    TraceScopes = [],
                    TraceResources = [],
                    OpenCode = "OtherVersionOpenCode",
                },
            };

            traceCollection.Traces.Add(traces[0]);
            traceCollection.Traces.Add(traces[1]);
            otherTraceCollection.Traces.Add(traces[2]);

            var context = Substitute.For<TracesDbContext>(new DbContextOptionsBuilder<TracesDbContext>().Options);
            var mockset = traces.BuildMockDbSet();
            context.Traces.Returns(mockset);
            return context;
        }

        private IMediator CreateMockMediator(ErrorCode? errorCode = null)
        {
            var mediator = Substitute.For<IMediator>();
            Result<GetProjectResponse> projectResult = errorCode is null
                ? CreateProjectResponse(_projectId)
                : errorCode.Value;

            mediator
                .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
                .Returns(projectResult);

            return mediator;
        }

        [Fact]
        public async Task WhenVersionExists_ReturnsOpenCodesForThatVersion()
        {
            var handler = new GetVersionOpencodeHandler(CreateContext(), CreateMockMediator());

            var result = await handler.Handle(
                new GetVersionOpencodeQuery
                {
                    ProjectId = _projectId,
                    ProjectVersionId = _projectVersionId,
                    UserId = _userId,
                },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeTrue();
            result.Value.Opencodes.ShouldHaveSingleItem();
            var opencode = result.Value.Opencodes.Single();
            opencode.TraceId.ShouldBe(_traceIdWithOpenCode);
            opencode.OpenCode.ShouldBe("OpenCode1");
        }

        [Fact]
        public async Task WhenVersionDoesNotBelongToProject_ReturnsEntityNotFound()
        {
            var handler = new GetVersionOpencodeHandler(CreateContext(), CreateMockMediator());

            var result = await handler.Handle(
                new GetVersionOpencodeQuery
                {
                    ProjectId = _projectId,
                    ProjectVersionId = Guid.NewGuid(),
                    UserId = _userId,
                },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        }

        [Fact]
        public async Task WhenProjectCannotBeRetrieved_ReturnsProjectError()
        {
            var context = Substitute.For<TracesDbContext>(new DbContextOptionsBuilder<TracesDbContext>().Options);
            var handler = new GetVersionOpencodeHandler(context, CreateMockMediator(ErrorCode.EntityNotFound));

            var result = await handler.Handle(
                new GetVersionOpencodeQuery
                {
                    ProjectId = _projectId,
                    ProjectVersionId = _projectVersionId,
                    UserId = _userId,
                },
                CancellationToken.None
            );

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
                Versions =
                [
                    new GetAllProjectVersionsResponse.ProjectVersionSummary
                    {
                        VersionId = _projectVersionId,
                        Name = "Version 1",
                        Description = "Version 1 Description",
                        ProjectId = projectId,
                    },
                ],
                AssessmentCriteria = [],
            };
        }
    }
}
