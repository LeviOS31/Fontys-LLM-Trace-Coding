using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RawLLMOutputs.Data;
using System;
using System.Collections.Generic;
using System.Text;

namespace RawLLMOutputs.Extensions
{
    public static class ApplicationExtensions
    {
        public static IServiceCollection AddRawLLMOutputModule(
            this IServiceCollection services,
            IConfiguration configuration
        )
        {
            services.AddDbContext<RawLLMOutputDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("Default"))
            );
            return services;
        }
    }
}
