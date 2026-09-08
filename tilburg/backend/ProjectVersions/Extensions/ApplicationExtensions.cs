using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ProjectVersions.Data;
using ProjectVersions.Shared;

namespace ProjectVersions.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddProjectVersionsModule(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services.AddDbContext<ProjectVersionsDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Default"))
        );

        services.AddScoped<DeleteVersion>();

        return services;
    }
}
