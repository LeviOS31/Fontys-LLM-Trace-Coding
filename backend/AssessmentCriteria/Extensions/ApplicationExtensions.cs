using AssessmentCriteria.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AssessmentCriteria.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddAssessmentCriteriaModule(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services.AddDbContext<AssessmentCriteriaDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Default"))
        );

        return services;
    }
}
