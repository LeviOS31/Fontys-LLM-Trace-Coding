using AxialCodes.Data;
using Microsoft.EntityFrameworkCore;

namespace AxialCodes.Tests.Data;

public class AxialCodeDbContextMigrationsTests
{
    [Fact]
    public void Model_HasNoPendingChangesComparedToMigrations()
    {
        // Arrange — no connection is opened; the provider is only needed to build the relational model.
        var options = new DbContextOptionsBuilder<AxialCodeDbContext>()
            .UseNpgsql("Host=localhost;Database=unused")
            .Options;
        using var context = new AxialCodeDbContext(options);

        // Act
        var hasPendingChanges = context.Database.HasPendingModelChanges();

        // Assert
        Assert.False(hasPendingChanges, "The AxialCodes model changed without a matching migration.");
    }
}
