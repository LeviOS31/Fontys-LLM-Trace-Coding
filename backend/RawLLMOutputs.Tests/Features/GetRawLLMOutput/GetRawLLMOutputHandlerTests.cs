using Mediator;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using RawLLMOutputs.Contracts.Features.GetRawLLMOutput;
using RawLLMOutputs.Data;
using RawLLMOutputs.Data.Models;
using RawLLMOutputs.Features.GetRawLLMOutput;
using Shared;
using Shouldly;

namespace RawLLMOutputs.Tests.Features.GetRawLLMOutput
{
    public class GetRawLLMOutputHandlerTests
    {
        [Fact]
        public async Task WhenRawLlmOutputExists_ReturnsMappedOutput()
        {
            var output = CreateOutput();
            using var database = CreateDatabase();
            database.Context.RawLLMOutputs.Add(output);
            await database.Context.SaveChangesAsync();

            var result = await CreateHandler(database.Context).Handle(
                new GetRawLLMOutputQuery { RawLLMOutputId = output.RawLLMOutputId },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeTrue();
            var response = result.Value;
            response.RawLLMOutputId.ShouldBe(output.RawLLMOutputId);
            response.VersionId.ShouldBe(output.VersionId);
            response.Name.ShouldBe(output.Name);
            response.Output.ShouldBe(output.Output);
            response.CreatedAt.ShouldBe(output.CreatedAt);
        }

        [Fact]
        public async Task WhenRawLlmOutputDoesNotExist_ReturnsEntityNotFound()
        {
            using var database = CreateDatabase();

            var result = await CreateHandler(database.Context).Handle(
                new GetRawLLMOutputQuery { RawLLMOutputId = Guid.NewGuid() },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.EntityNotFound);
        }

        [Fact]
        public async Task WhenDatabaseQueryFails_ReturnsDatabaseError()
        {
            using var database = CreateDatabase();
            await database.Context.DisposeAsync();

            var result = await CreateHandler(database.Context).Handle(
                new GetRawLLMOutputQuery { RawLLMOutputId = Guid.NewGuid() },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
        }

        private static GetRawLLMOutputHandler CreateHandler(RawLLMOutputDbContext context)
        {
            return new GetRawLLMOutputHandler(context, Substitute.For<IMediator>());
        }

        private static RawLLMOutput CreateOutput()
        {
            return new RawLLMOutput
            {
                RawLLMOutputId = Guid.NewGuid(),
                VersionId = Guid.NewGuid(),
                Name = "Imported output",
                Output = "{\"output\":\"test\"}",
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
