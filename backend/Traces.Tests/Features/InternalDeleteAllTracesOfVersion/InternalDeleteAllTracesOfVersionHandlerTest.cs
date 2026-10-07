using Mediator;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using Shouldly;
using Shared;
using Traces.Contracts.Features.DeleteAllTracesOfVersion;
using Traces.Data;
using Traces.Data.Models;
using Traces.Features.DeleteTraceCollectionUnauthorized;
using Traces.Features.InternalDeleteAllTracesOfVersion;

namespace Traces.Tests.Features.InternalDeleteAllTracesOfVersion
{
    public class InternalDeleteAllTracesOfVersionHandlerTest
    {
        private readonly Guid _versionId = Guid.NewGuid();
        private readonly Guid _otherVersionId = Guid.NewGuid();
        private readonly Guid _traceCollectionId = Guid.NewGuid();
        private readonly Guid _secondTraceCollectionId = Guid.NewGuid();

        private TracesDbContext CreateContext()
        {
            var traceCollections = new List<TraceCollection>
            {
                new()
                {
                    TraceCollectionId = _traceCollectionId,
                    ProjectVersionId = _versionId,
                    Name = "First collection",
                    CreatedAt = DateTime.UtcNow,
                    Traces = [],
                },
                new()
                {
                    TraceCollectionId = _secondTraceCollectionId,
                    ProjectVersionId = _versionId,
                    Name = "Second collection",
                    CreatedAt = DateTime.UtcNow,
                    Traces = [],
                },
                new()
                {
                    TraceCollectionId = Guid.NewGuid(),
                    ProjectVersionId = _otherVersionId,
                    Name = "Other version collection",
                    CreatedAt = DateTime.UtcNow,
                    Traces = [],
                },
            };

            var context = Substitute.For<TracesDbContext>(new DbContextOptionsBuilder<TracesDbContext>().Options);
            var mockset = traceCollections.BuildMockDbSet();
            context.TraceCollections.Returns(mockset);
            return context;
        }

        private IMediator CreateMockMediator(ErrorCode? errorCode = null)
        {
            var mediator = Substitute.For<IMediator>();
            Result<DeleteTraceCollectionUnauthorizedResponse> deleteResult = errorCode is null
                ? new DeleteTraceCollectionUnauthorizedResponse()
                : errorCode.Value;

            mediator
                .Send(Arg.Any<DeleteTraceCollectionUnauthorizedRequest>(), Arg.Any<CancellationToken>())
                .Returns(deleteResult);

            return mediator;
        }

        [Fact]
        public async Task WhenCollectionsExist_DeletesAllCollectionsForVersion()
        {
            var mediator = CreateMockMediator();
            var handler = new InternalDeleteAllTracesOfVersionHandler(CreateContext(), mediator);

            var result = await handler.Handle(new DeleteAllTracesOfVersionRequest { VersionId = _versionId }, CancellationToken.None);

            result.IsSuccess.ShouldBeTrue();
            _ = mediator.Received(1).Send(
                Arg.Is<DeleteTraceCollectionUnauthorizedRequest>(request => request.TraceCollectionId == _traceCollectionId),
                Arg.Any<CancellationToken>()
            );
            _ = mediator.Received(1).Send(
                Arg.Is<DeleteTraceCollectionUnauthorizedRequest>(request => request.TraceCollectionId == _secondTraceCollectionId),
                Arg.Any<CancellationToken>()
            );
            mediator.ReceivedCalls().Count().ShouldBe(2);
        }

        [Fact]
        public async Task WhenNoCollectionsExistForVersion_ReturnsNoChanges()
        {
            var mediator = CreateMockMediator();
            var handler = new InternalDeleteAllTracesOfVersionHandler(CreateContext(), mediator);

            var result = await handler.Handle(
                new DeleteAllTracesOfVersionRequest { VersionId = Guid.NewGuid() },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.NoChanges);
            _ = mediator.DidNotReceiveWithAnyArgs().Send(
                Arg.Any<DeleteTraceCollectionUnauthorizedRequest>(),
                Arg.Any<CancellationToken>()
            );
        }

        [Fact]
        public async Task WhenDeletingCollectionFails_ReturnsChildError()
        {
            var mediator = CreateMockMediator(ErrorCode.DatabaseError);
            var handler = new InternalDeleteAllTracesOfVersionHandler(CreateContext(), mediator);

            var result = await handler.Handle(new DeleteAllTracesOfVersionRequest { VersionId = _versionId }, CancellationToken.None);

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
            _ = mediator.Received(1).Send(
                Arg.Any<DeleteTraceCollectionUnauthorizedRequest>(),
                Arg.Any<CancellationToken>()
            );
        }
    }
}
