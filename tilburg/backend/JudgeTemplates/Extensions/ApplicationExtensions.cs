using JudgeTemplates.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace JudgeTemplates.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddJudgeTemplatesModule(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services.AddDbContext<JudgeTemplatesDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Default"))
        );

        return services;
    }
}
