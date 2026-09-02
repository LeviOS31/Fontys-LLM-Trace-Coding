using FluentValidation;
using Mediator;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Shared.Builders;
using Shared.Interfaces;
using Shared.Middleware;

namespace Shared.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddSharedModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddValidatorsFromAssemblies(AppDomain.CurrentDomain.GetAssemblies());
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(FeatureRequestValidatorBehavior<,>));

        services.AddScoped<IChatClientBuilder, ChatClientBuilder>();

        // http clients
        services.AddHttpClient(
            "ollama",
            client =>
            {
                var timeoutMinutes = configuration.GetValue("AI:Ollama:TimeoutMinutes", 5);
                client.Timeout = TimeSpan.FromMinutes(timeoutMinutes);
            }
        );

        return services;
    }
}
