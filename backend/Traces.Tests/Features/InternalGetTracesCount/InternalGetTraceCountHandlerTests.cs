using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using Shouldly;
using Traces.Contracts.Features.GetTracesCount;
using Traces.Data;
using Traces.Data.Models;
using Traces.Features.InternalGetTracesCount;

namespace Traces.Tests.Features.InternalGetTracesCount
{
    public class InternalGetTraceCountHandlerTests
    {
        private readonly Guid _projectId = Guid.NewGuid();
        private readonly Guid _projectVersionId = Guid.NewGuid();
        private readonly Guid _otherProjectVersionId = Guid.NewGuid();

        private TracesDbContext CreateContext()
        {
            var traceCollection = new TraceCollection
            {
                TraceCollectionId = Guid.NewGuid(),
                ProjectVersionId = _projectVersionId,
                Name = "Test collection",
                CreatedAt = DateTime.UtcNow,
                Traces = [],
            };

            var otherTraceCollection = new TraceCollection
            {
                TraceCollectionId = Guid.NewGuid(),
                ProjectVersionId = _otherProjectVersionId,
                Name = "Other collection",
                CreatedAt = DateTime.UtcNow,
                Traces = [],
            };

            var traces = new List<Trace>
            {
                new()
                {
                    TraceId = Guid.NewGuid(),
                    TraceCollectionId = traceCollection.TraceCollectionId,
                    TraceCollection = traceCollection,
                    UpdatedAt = DateTime.UtcNow,
                    TraceScopes = [],
                    TraceResources = [],
                },
                new()
                {
                    TraceId = Guid.NewGuid(),
                    TraceCollectionId = traceCollection.TraceCollectionId,
                    TraceCollection = traceCollection,
                    UpdatedAt = DateTime.UtcNow,
                    TraceScopes = [],
                    TraceResources = [],
                },
                new()
                {
                    TraceId = Guid.NewGuid(),
                    TraceCollectionId = otherTraceCollection.TraceCollectionId,
                    TraceCollection = otherTraceCollection,
                    UpdatedAt = DateTime.UtcNow,
                    TraceScopes = [],
                    TraceResources = [],
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

        [Fact]
        public async Task WhenTracesExist_ReturnsCountForRequestedVersion()
        {
            var handler = new InternalGetTracesCountHandler(CreateContext());

            var result = await handler.Handle(
                new GetTracesCountQuery
                {
                    ProjectId = _projectId,
                    ProjectVersionId = _projectVersionId,
                },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeTrue();
            result.Value.TotalCount.ShouldBe(2);
        }

        [Fact]
        public async Task WhenVersionHasNoTraces_ReturnsZero()
        {
            var handler = new InternalGetTracesCountHandler(CreateContext());

            var result = await handler.Handle(
                new GetTracesCountQuery
                {
                    ProjectId = _projectId,
                    ProjectVersionId = Guid.NewGuid(),
                },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeTrue();
            result.Value.TotalCount.ShouldBe(0);
        }
    }
}
