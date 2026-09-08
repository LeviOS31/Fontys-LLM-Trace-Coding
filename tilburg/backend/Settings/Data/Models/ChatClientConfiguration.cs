using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.Extensions.Configuration;

namespace Settings.Data.Models;

public class ChatClientConfiguration
{
    public const int MaxProviderLength = 64;
    public const int MaxEndpointLength = 256;
    public const int MaxModelLength = 64;

    public required Guid UserId { get; init; }
    public required string? Provider { get; set; }
    public required Uri? Endpoint { get; set; }
    public required string? Model { get; set; }
}

internal sealed class ChatClientConfigurationEntityConfiguration : IEntityTypeConfiguration<ChatClientConfiguration>
{
    private readonly IConfiguration _configuration;

    public ChatClientConfigurationEntityConfiguration(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public void Configure(EntityTypeBuilder<ChatClientConfiguration> builder)
    {
        builder.HasKey(x => x.UserId);
        builder.Property(x => x.Provider).HasMaxLength(ChatClientConfiguration.MaxProviderLength);
        builder.Property(x => x.Endpoint).HasMaxLength(ChatClientConfiguration.MaxEndpointLength);
        builder.Property(x => x.Model).HasMaxLength(ChatClientConfiguration.MaxModelLength);

        // Seed data
        var provider = _configuration["AI:Provider"]!;
        var endpoint = new Uri(_configuration[$"AI:{provider}:Endpoint"]!);
        var model = _configuration[$"AI:{provider}:Model"]!;

        builder.HasData(
            new ChatClientConfiguration
            {
                UserId = Guid.Parse("EC1145A3-869D-4B06-B4AE-7308D85839B7"),
                Provider = provider,
                Endpoint = endpoint,
                Model = model,
            }
        );
    }
}
