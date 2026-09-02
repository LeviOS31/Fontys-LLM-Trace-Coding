using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Statistics.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddStatisticsModule(this IServiceCollection services, IConfiguration configuration)
    {
        return services;
    }
}
