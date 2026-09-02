using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Traces.Data;

namespace Projects.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddTracesModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<TracesDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Default"))
        );

        return services;
    }
}
