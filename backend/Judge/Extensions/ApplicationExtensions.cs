using Judge.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Judge.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddJudgeModule(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services.AddDbContext<JudgeDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Default"))
        );

        return services;
    }
}