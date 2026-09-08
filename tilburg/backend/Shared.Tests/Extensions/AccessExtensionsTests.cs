using Shared.Extensions;
using Shared.Interfaces;

namespace Shared.Tests.Extensions;

public class AccessExtensionsTests
{
    private class TestEntity : IUserOwned
    {
        public Guid UserId { get; set; }
    }

    [Fact]
    public void HasAccess_ReturnsTrue_WhenUserIdMatches()
    {
        var userId = Guid.NewGuid();
        var entity = new TestEntity { UserId = userId };

        var result = entity.HasAccess(userId);

        Assert.True(result);
    }

    [Fact]
    public void HasAccess_ReturnsFalse_WhenUserIdDoesNotMatch()
    {
        var entity = new TestEntity { UserId = Guid.NewGuid() };

        var result = entity.HasAccess(Guid.NewGuid());

        Assert.False(result);
    }

    [Fact]
    public void HasAccess_ReturnsFalse_WhenEntityUserIdIsEmpty()
    {
        var entity = new TestEntity { UserId = Guid.Empty };

        var result = entity.HasAccess(Guid.NewGuid());

        Assert.False(result);
    }

    [Fact]
    public void HasAccess_ReturnsFalse_WhenProvidedUserIdIsEmpty()
    {
        var entity = new TestEntity { UserId = Guid.NewGuid() };

        var result = entity.HasAccess(Guid.Empty);

        Assert.False(result);
    }

    [Fact]
    public void HasAccess_ReturnsTrue_WhenBothUserIdsAreEmpty()
    {
        var entity = new TestEntity { UserId = Guid.Empty };

        var result = entity.HasAccess(Guid.Empty);

        Assert.True(result);
    }
}
