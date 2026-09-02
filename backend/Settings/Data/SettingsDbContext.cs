using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Settings.Data.Models;

namespace Settings.Data;

public class SettingsDbContext : DbContext
{
    public SettingsDbContext(DbContextOptions<SettingsDbContext> options)
        : base(options) { }

    public virtual DbSet<ChatClientConfiguration> ChatClientConfigurations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            Assembly.GetExecutingAssembly(),
            t => t != typeof(ChatClientConfigurationEntityConfiguration)
        );

        var configuration = this.GetService<IConfiguration>();
        modelBuilder.ApplyConfiguration(new ChatClientConfigurationEntityConfiguration(configuration));

        base.OnModelCreating(modelBuilder);
    }
}
