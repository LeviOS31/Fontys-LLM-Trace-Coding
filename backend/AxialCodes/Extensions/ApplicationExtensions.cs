using AxialCodes.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AxialCodes.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddAxialCodesModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AxialCodeDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Default"))
        );

        return services;
    }
}
