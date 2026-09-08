using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Settings.Data;

namespace Settings.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddSettingsModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<SettingsDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Default"))
        );

        return services;
    }
}
