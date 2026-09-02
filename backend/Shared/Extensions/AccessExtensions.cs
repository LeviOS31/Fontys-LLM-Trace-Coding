using Shared.Interfaces;

namespace Shared.Extensions;

public static class AccessExtensions
{
    public static bool HasAccess<T>(this T entity, Guid userId)
        where T : IUserOwned
    {
        return entity.UserId == userId;
    }
}
