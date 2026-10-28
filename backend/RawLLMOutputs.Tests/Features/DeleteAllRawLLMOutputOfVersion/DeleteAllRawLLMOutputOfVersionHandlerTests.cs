using Mediator;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using RawLLMOutputs.Contracts.Features.DeleteAllRawLLMOutputOfVersion;
using RawLLMOutputs.Data;
using RawLLMOutputs.Data.Models;
using RawLLMOutputs.Features.DeleteAllRawLLMOutputOfVersion;
using Shared;
using Shouldly;

namespace RawLLMOutputs.Tests.Features.DeleteAllRawLLMOutputOfVersion
{
    public class DeleteAllRawLLMOutputOfVersionHandlerTests
    {
        [Fact]
        public async Task WhenOutputsExistForVersion_DeletesAllMatchingOutputs()
        {
            var versionId = Guid.NewGuid();
            using var database = CreateDatabase();
            database.Context.RawLLMOutputs.AddRange(
                CreateOutput(versionId),
                CreateOutput(versionId),
                CreateOutput(Guid.NewGuid())
            );
            await database.Context.SaveChangesAsync();

            var result = await CreateHandler(database.Context).Handle(
                new DeleteAllRawLLMOutputOfVersionQuery { VersionId = versionId },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeTrue();
            result.Value.ShouldNotBeNull();
            (await database.Context.RawLLMOutputs.CountAsync(x => x.VersionId == versionId)).ShouldBe(0);
            (await database.Context.RawLLMOutputs.CountAsync()).ShouldBe(1);
        }

        [Fact]
        public async Task WhenNoOutputsExistForVersion_ReturnsNoChanges()
        {
            using var database = CreateDatabase();

            var result = await CreateHandler(database.Context).Handle(
                new DeleteAllRawLLMOutputOfVersionQuery { VersionId = Guid.NewGuid() },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.NoChanges);
        }

        [Fact]
        public async Task WhenDatabaseDeleteFails_ReturnsDatabaseError()
        {
            using var database = CreateDatabase();
            var versionId = Guid.NewGuid();
            database.Context.RawLLMOutputs.Add(CreateOutput(versionId));
            await database.Context.SaveChangesAsync();
            await database.Context.DisposeAsync();

            var result = await CreateHandler(database.Context).Handle(
                new DeleteAllRawLLMOutputOfVersionQuery { VersionId = versionId },
                CancellationToken.None
            );

            result.IsSuccess.ShouldBeFalse();
            result.ErrorCode.ShouldBe(ErrorCode.DatabaseError);
        }

        private static DeleteAllRawLLMOutputOfVersionHandler CreateHandler(RawLLMOutputDbContext context)
        {
            return new DeleteAllRawLLMOutputOfVersionHandler(context, Substitute.For<IMediator>());
        }

        private static RawLLMOutput CreateOutput(Guid versionId)
        {
            return new RawLLMOutput
            {
                RawLLMOutputId = Guid.NewGuid(),
                VersionId = versionId,
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
