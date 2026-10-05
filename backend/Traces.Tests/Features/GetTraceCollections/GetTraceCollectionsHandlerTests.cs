using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using Projects.Contracts.Features.GetAllProjectVersions;
using Projects.Contracts.Features.GetProject;
using Shared;
using Shouldly;
using Traces.Data;
using Traces.Data.Models;
using Traces.Features.GetTraceCollections;

namespace Traces.Tests.Features.GetTraceCollections
{
    public class GetTraceCollectionsHandlerTests
    {
        private readonly Guid _traceCollectionId = Guid.NewGuid();
        private readonly Guid _userId = Guid.NewGuid();
        private readonly Guid _projectId = Guid.NewGuid();
        private readonly Guid _projectVersionId = Guid.NewGuid();

        private IMediator CreateMockMediator(ErrorCode? errorCode = null)
        {
            var mediator = Substitute.For<IMediator>();

            mediator
                .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
                .Returns(errorCode is null ? CreateProjectResponse(_projectId) : errorCode.Value);

            return mediator;
        }

        private TracesDbContext CreateContext()
        {
            var matchingCollection = new TraceCollection
            {
                TraceCollectionId = _traceCollectionId,
                ProjectVersionId = _projectVersionId,
                Name = "Matching collection",
                CreatedAt = DateTime.UtcNow,
                Traces = new List<Trace>()
            };

            List<Trace> traces = new List<Trace>
            {
                new Trace
                {
                    TraceId = Guid.NewGuid(),
                    TraceCollectionId = _traceCollectionId,
                    TraceCollection = matchingCollection,
                    TraceGroupId = null,
                    UpdatedAt = DateTime.UtcNow,
                    TraceScopes = new List<TraceScope>(),
                    TraceResources = new List<TraceResource>(),
                    OpenCode = "OpenCode1",
                },
                new Trace
                {
                    TraceId = Guid.NewGuid(),
                    TraceCollectionId = _traceCollectionId,
                    TraceCollection = matchingCollection,
                    TraceGroupId = null,
                    UpdatedAt = DateTime.UtcNow,
                    TraceScopes = new List<TraceScope>(),
                    TraceResources = new List<TraceResource>(),
                    OpenCode = "OpenCode2",
                }
            };

            matchingCollection.Traces.Add(traces[0]);
            matchingCollection.Traces.Add(traces[1]);

            var collections = new List<TraceCollection>
            {
                matchingCollection,
                new()
                {
                    TraceCollectionId = Guid.NewGuid(),
                    ProjectVersionId = Guid.NewGuid(),
                    Name = "Other version collection",
                    CreatedAt = DateTime.UtcNow,
                    Traces = [],
                },
            };

            var context = Substitute.For<TracesDbContext>(new DbContextOptionsBuilder<TracesDbContext>().Options);
            var mockdbset = collections.BuildMockDbSet();
            context.TraceCollections.Returns(mockdbset);
            return context;
        }

        [Fact]
        public async Task WhenCollectionsExist_ReturnsCollectionOverviews()
        {
            var handler = new GetTraceCollectionsHandler(CreateContext(), CreateMockMediator());

            var result = await handler.Handle(
                new GetTraceCollectionsQuery
                {
                    ProjectId = _projectId,
                    UserId = _userId,
                    VersionId = _projectVersionId,
                },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeTrue();
            result.Value.TraceCollections.ShouldHaveSingleItem();
            var overview = result.Value.TraceCollections.Single();
            overview.TraceCollectionId.ShouldBe(_traceCollectionId);
            overview.Name.ShouldBe("Matching collection");
            overview.TracersCount.ShouldBe(2);
        }

        [Fact]
        public async Task WhenNoCollectionsMatchVersion_ReturnsEmptyCollection()
        {
            var handler = new GetTraceCollectionsHandler(CreateContext(), CreateMockMediator());

            var result = await handler.Handle(
                new GetTraceCollectionsQuery
                {
                    ProjectId = _projectId,
                    UserId = _userId,
                    VersionId = Guid.NewGuid(),
                },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeTrue();
            result.Value.TraceCollections.ShouldBeEmpty();
        }

        [Fact]
        public async Task WhenProjectCannotBeRetrieved_ReturnsProjectError()
        {
            var context = Substitute.For<TracesDbContext>(new DbContextOptionsBuilder<TracesDbContext>().Options);
            var handler = new GetTraceCollectionsHandler(context, CreateMockMediator(ErrorCode.EntityNotFound));

            var result = await handler.Handle(
                new GetTraceCollectionsQuery
                {
                    ProjectId = _projectId,
                    UserId = _userId,
                    VersionId = _projectVersionId,
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
                Versions = [new GetAllProjectVersionsResponse.ProjectVersionSummary { VersionId = _projectVersionId, Name = "Version 1", Description = "Version 1 Description", ProjectId = projectId }],
                AssessmentCriteria = [],
            };
        }
    }
}
