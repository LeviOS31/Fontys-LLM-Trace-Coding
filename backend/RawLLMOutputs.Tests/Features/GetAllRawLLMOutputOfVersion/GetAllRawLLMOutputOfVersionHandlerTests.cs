using Mediator;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using RawLLMOutputs.Contracts.Features.GetAllRawLLMOutputOfVersion;
using RawLLMOutputs.Data;
using RawLLMOutputs.Data.Models;
using RawLLMOutputs.Features.GetAllRawLLMOutputOfVersion;
using Shouldly;

namespace RawLLMOutputs.Tests.Features.GetAllRawLLMOutputOfVersion
{
    public class GetAllRawLLMOutputOfVersionHandlerTests
    {
        [Fact]
        public async Task WhenOutputsExistForVersion_ReturnsMappedOutputs()
        {
            var versionId = Guid.NewGuid();
            var firstOutput = CreateOutput(versionId, "First output", "{\"value\":1}");
            var secondOutput = CreateOutput(versionId, "Second output", "{\"value\":2}");
            using var database = CreateDatabase();
            database.Context.RawLLMOutputs.AddRange(firstOutput, secondOutput, CreateOutput(Guid.NewGuid(), "Other", "{}"));
            await database.Context.SaveChangesAsync();

            var result = await CreateHandler(database.Context).Handle(
                new GetAllRawLLMOutputOfVersionQuery { VersionId = versionId },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeTrue();
            result.Value.RawLLMOutputs.Count.ShouldBe(2);
            result.Value.RawLLMOutputs.ShouldContain(output =>
                output.RawLLMOutputId == firstOutput.RawLLMOutputId &&
                output.VersionId == versionId &&
                output.Name == firstOutput.Name &&
                output.Output == firstOutput.Output &&
                output.CreatedAt == firstOutput.CreatedAt
            );
            result.Value.RawLLMOutputs.ShouldContain(output =>
                output.RawLLMOutputId == secondOutput.RawLLMOutputId &&
                output.VersionId == versionId &&
                output.Name == secondOutput.Name &&
                output.Output == secondOutput.Output &&
                output.CreatedAt == secondOutput.CreatedAt
            );
        }

        [Fact]
        public async Task WhenNoOutputsExistForVersion_ReturnsEmptyList()
        {
            using var database = CreateDatabase();
            database.Context.RawLLMOutputs.Add(CreateOutput(Guid.NewGuid(), "Other", "{}"));
            await database.Context.SaveChangesAsync();

            var result = await CreateHandler(database.Context).Handle(
                new GetAllRawLLMOutputOfVersionQuery { VersionId = Guid.NewGuid() },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeTrue();
            result.Value.RawLLMOutputs.ShouldBeEmpty();
        }

        [Fact]
        public async Task WhenDatabaseQueryFails_ReturnsDatabaseError()
        {
            using var database = CreateDatabase();
            await database.Context.DisposeAsync();

            var result = await CreateHandler(database.Context).Handle(
                new GetAllRawLLMOutputOfVersionQuery { VersionId = Guid.NewGuid() },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(Shared.ErrorCode.DatabaseError);
        }

        private static GetAllRawLLMOutputOfVersionhandler CreateHandler(RawLLMOutputDbContext context)
        {
            return new GetAllRawLLMOutputOfVersionhandler(
                Substitute.For<IMediator>(),
                context
            );
        }

        private static RawLLMOutput CreateOutput(Guid versionId, string name, string output)
        {
            return new RawLLMOutput
            {
                RawLLMOutputId = Guid.NewGuid(),
                VersionId = versionId,
                Name = name,
                Output = output,
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
