using Mediator;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Projects.Contracts.Features.GetAllProjectVersions;
using Projects.Contracts.Features.GetProject;
using RawLLMOutputs.Data;
using RawLLMOutputs.Data.Models;
using RawLLMOutputs.Features.DeleteRawLLMData;
using RawLLMOutputs.Features.DeleteRawLLMOuput;
using Shared;
using Shouldly;

namespace RawLLMOutputs.Tests.Features.DeleteRawLLMOutput
{
    public class DeleteRawLLMOutputHandlerTests
    {
        [Fact]
        public async Task WhenProjectDoesNotExist_ReturnsProjectError()
        {
            var request = CreateRequest();
            var mediator = Substitute.For<IMediator>();
            mediator
                .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
                .Returns(ErrorCode.EntityNotFound);
            using var database = CreateDatabase();

            var result = await CreateHandler(database.Context, mediator).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
            await mediator.DidNotReceive().Send(
                Arg.Any<GetAllProjectVersionsQuery>(),
                Arg.Any<CancellationToken>()
            );
        }

        [Fact]
        public async Task WhenProjectVersionsCannotBeRetrieved_ReturnsVersionsError()
        {
            var request = CreateRequest();
            var mediator = CreateMediator(request.ProjectId, ErrorCode.DatabaseError);
            using var database = CreateDatabase();

            var result = await CreateHandler(database.Context, mediator).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
        }

        [Fact]
        public async Task WhenRawLlmOutputDoesNotExist_ReturnsEntityNotFound()
        {
            var request = CreateRequest();
            var mediator = CreateMediator(request.ProjectId);
            using var database = CreateDatabase();

            var result = await CreateHandler(database.Context, mediator).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        }

        [Fact]
        public async Task WhenRequestIsValid_DeletesRawLlmOutput()
        {
            var request = CreateRequest();
            var mediator = CreateMediator(request.ProjectId);
            using var database = CreateDatabase();
            database.Context.RawLLMOutputs.Add(new RawLLMOutput
            {
                RawLLMOutputId = request.RawLLMOutputId,
                VersionId = request.ProjectVersionId,
                Name = "Imported output",
                Output = "{\"output\":\"test\"}",
                CreatedAt = DateTime.UtcNow
            });
            await database.Context.SaveChangesAsync();

            var result = await CreateHandler(database.Context, mediator).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeTrue();
            result.Value.ShouldNotBeNull();
            (await database.Context.RawLLMOutputs.AnyAsync()).ShouldBeFalse();
        }

        [Fact]
        public async Task WhenRawLlmOutputBelongsToAnotherVersion_ReturnsEntityNotFound()
        {
            var request = CreateRequest();
            var mediator = CreateMediator(request.ProjectId);
            using var database = CreateDatabase();
            database.Context.RawLLMOutputs.Add(new RawLLMOutput
            {
                RawLLMOutputId = request.RawLLMOutputId,
                VersionId = Guid.NewGuid(),
                Name = "Imported output",
                Output = "{\"output\":\"test\"}",
                CreatedAt = DateTime.UtcNow
            });
            await database.Context.SaveChangesAsync();

            var result = await CreateHandler(database.Context, mediator).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
            (await database.Context.RawLLMOutputs.CountAsync()).ShouldBe(1);
        }

        [Fact]
        public async Task WhenDatabaseCheckFails_ReturnsDatabaseError()
        {
            var request = CreateRequest();
            var mediator = CreateMediator(request.ProjectId);
            using var database = CreateDatabase();
            await database.Context.DisposeAsync();

            var result = await CreateHandler(database.Context, mediator).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
        }

        private static DeleteRawLLMOutputHandler CreateHandler(
            RawLLMOutputDbContext context,
            IMediator mediator
        )
        {
            return new DeleteRawLLMOutputHandler(context, mediator);
        }

        private static IMediator CreateMediator(Guid projectId, ErrorCode? versionsError = null)
        {
            var mediator = Substitute.For<IMediator>();
            mediator
                .Send(Arg.Any<GetProjectQuery>(), Arg.Any<CancellationToken>())
                .Returns(CreateProjectResponse(projectId));

            if (versionsError.HasValue)
            {
                mediator
                    .Send(Arg.Any<GetAllProjectVersionsQuery>(), Arg.Any<CancellationToken>())
                    .Returns(versionsError.Value);
            }
            else
            {
                mediator
                    .Send(Arg.Any<GetAllProjectVersionsQuery>(), Arg.Any<CancellationToken>())
                    .Returns(new GetAllProjectVersionsResponse { Versions = [] });
            }

            return mediator;
        }

        private static DeleteRawLLMOutputRequest CreateRequest()
        {
            return new DeleteRawLLMOutputRequest
            {
                UserId = Guid.Parse("CE97539F-4189-44FC-A87F-CFA3EDB177ED"),
                ProjectId = Guid.Parse("68DF6625-60EA-4E0A-8F29-29DE14197024"),
                ProjectVersionId = Guid.Parse("68DF6625-60EA-4E0A-8F29-29DE14197025"),
                RawLLMOutputId = Guid.Parse("68DF6625-60EA-4E0A-8F29-29DE14197026")
            };
        }

        private static GetProjectResponse CreateProjectResponse(Guid projectId)
        {
            return new GetProjectResponse
            {
                ProjectId = projectId,
                Name = "Project",
                Description = "Description",
                Versions = [],
                AssessmentCriteria = []
            };
        }

        private static TestDatabase CreateDatabase()
        {
            var connection = new SqliteConnection("DataSource=:memory:");
            connection.Open();
            var options = new DbContextOptionsBuilder<RawLLMOutputDbContext>()
                .UseSqlite(connection)
                .Options;
            var context = new RawLLMOutputDbContext(options);
            context.Database.EnsureCreated();
            return new TestDatabase(context, connection);
        }

        private sealed class TestDatabase(RawLLMOutputDbContext context, SqliteConnection connection) : IDisposable
        {
            public RawLLMOutputDbContext Context { get; } = context;

            public void Dispose()
            {
                Context.Dispose();
                connection.Dispose();
            }
        }
    }
}
