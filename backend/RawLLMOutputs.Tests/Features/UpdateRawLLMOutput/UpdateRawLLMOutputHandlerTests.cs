using Mediator;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using MockQueryable.NSubstitute;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using RawLLMOutputs.Data;
using RawLLMOutputs.Data.Models;
using RawLLMOutputs.Features.UpdateRawLLMOutput;
using Shared;
using Shouldly;

namespace RawLLMOutputs.Tests.Features.UpdateRawLLMOutput
{
    public class UpdateRawLLMOutputHandlerTests
    {
        [Fact]
        public async Task WhenRawLlmOutputExists_UpdatesNameAndReturnsOutput()
        {
            var output = CreateOutput();
            using var database = CreateDatabase();
            database.Context.RawLLMOutputs.Add(output);
            await database.Context.SaveChangesAsync();
            var request = CreateRequest(output.RawLLMOutputId, "Updated name", "{\"output\":\"new\"}");

            var result = await CreateHandler(database.Context).Handle(request, CancellationToken.None);

            result.IsSuccess.ShouldBeTrue();
            var response = result.Value;
            response.RawLLMOutputId.ShouldBe(output.RawLLMOutputId);
            response.VersionId.ShouldBe(output.VersionId);
            response.Name.ShouldBe(request.Name);
            response.Output.ShouldBe(output.Output);
            response.CreatedAt.ShouldBe(output.CreatedAt);

            var savedOutput = await database.Context.RawLLMOutputs
                .AsNoTracking()
                .SingleAsync(x => x.RawLLMOutputId == output.RawLLMOutputId);
            savedOutput.Name.ShouldBe(request.Name);
            savedOutput.Output.ShouldBe(output.Output);
        }

        [Fact]
        public async Task WhenRawLlmOutputDoesNotExist_ReturnsEntityNotFound()
        {
            using var database = CreateDatabase();

            var result = await CreateHandler(database.Context).Handle(
                CreateRequest(Guid.NewGuid(), "Updated name", "{\"output\":\"new\"}"),
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        }

        [Fact]
        public async Task WhenSelectingFails_ReturnsDatabaseError()
        {
            var context = Substitute.For<RawLLMOutputDbContext>(
                new DbContextOptionsBuilder<RawLLMOutputDbContext>().Options
            );
            context.RawLLMOutputs.Throws(new InvalidOperationException("Database failure"));

            var result = await CreateHandler(context).Handle(
                CreateRequest(Guid.NewGuid(), "Updated name", "{\"output\":\"new\"}"),
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
        }

        [Fact]
        public async Task WhenSavingFails_ReturnsDatabaseError()
        {
            var output = CreateOutput();
            var outputSet = new List<RawLLMOutput> { output }.BuildMockDbSet();
            var context = Substitute.For<RawLLMOutputDbContext>(
                new DbContextOptionsBuilder<RawLLMOutputDbContext>().Options
            );
            context.RawLLMOutputs.Returns(outputSet);
            context.SaveChangesAsync(Arg.Any<CancellationToken>())
                .Throws(new InvalidOperationException("Database failure"));

            var result = await CreateHandler(context).Handle(
                CreateRequest(output.RawLLMOutputId, "Updated name", "{\"output\":\"new\"}"),
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
        }

        private static UpdateRawLLMOutputHandler CreateHandler(RawLLMOutputDbContext context)
        {
            return new UpdateRawLLMOutputHandler(Substitute.For<IMediator>(), context);
        }

        private static UpdateRawLLMOutputRequest CreateRequest(Guid outputId, string name, string output)
        {
            return new UpdateRawLLMOutputRequest
            {
                RawLLMOutputId = outputId,
                VersionId = Guid.NewGuid(),
                Name = name,
            };
        }

        private static RawLLMOutput CreateOutput()
        {
            return new RawLLMOutput
            {
                RawLLMOutputId = Guid.NewGuid(),
                VersionId = Guid.NewGuid(),
                Name = "Original name",
                Output = "{\"output\":\"original\"}",
                CreatedAt = DateTime.UtcNow
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
