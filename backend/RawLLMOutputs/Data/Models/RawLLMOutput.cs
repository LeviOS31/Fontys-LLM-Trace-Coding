using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace RawLLMOutputs.Data.Models
{
    public class RawLLMOutput
    {
        public required Guid RawLLMOutputId { get; init; }
        public required Guid VersionId { get; init; }
        public required string Name { get; set; }
        public required string Output { get; set; }
        public required DateTime CreatedAt { get; init; }
    }

    internal sealed class RawLLMOutputEntityConfiguration : IEntityTypeConfiguration<RawLLMOutput>
    {
        public void Configure(EntityTypeBuilder<RawLLMOutput> builder)
        {
            builder.HasKey(x => x.RawLLMOutputId);
            builder.Property(x => x.VersionId).IsRequired();
            builder.Property(x => x.Name).IsRequired();
            builder.Property(x => x.Output).IsRequired();
            builder.Property(x => x.CreatedAt).IsRequired();
        }
    }
}
