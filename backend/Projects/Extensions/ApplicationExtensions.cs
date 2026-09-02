using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Projects.Data;

namespace Projects.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddProjectsModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ProjectDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Default"))
        );

        return services;
    }
}
