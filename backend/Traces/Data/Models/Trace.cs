using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Traces.Data.Models;

public class Trace
{
    public const int MaxOpenCodeLength = 255;
    public required Guid TraceId { get; init; }
    public required Guid TraceCollectionId { get; init; }
    public required TraceCollection TraceCollection { get; init; }
    public Guid? TraceGroupId { get; set; }
    public TraceGroup? TraceGroup { get; set; }
    public required ICollection<TraceResource> TraceResources { get; init; }
    public required ICollection<TraceScope> TraceScopes { get; init; }
    public string? OpenCode { get; set; }
    public required DateTime UpdatedAt { get; set; }
}

internal sealed class TraceEntityConfiguration : IEntityTypeConfiguration<Trace>
{
    public void Configure(EntityTypeBuilder<Trace> builder)
    {
        builder.HasKey(x => x.TraceId);
        builder.Property(x => x.TraceCollectionId);
        builder.Property(x => x.OpenCode).HasMaxLength(Trace.MaxOpenCodeLength);
        builder.Property(x => x.UpdatedAt);
        builder.HasOne(x => x.TraceCollection).WithMany(x => x.Traces).HasForeignKey(x => x.TraceCollectionId);
        builder.Property(x => x.TraceGroupId).IsRequired(false);
        builder.HasOne(x => x.TraceGroup).WithMany(x => x.Traces).HasForeignKey(x => x.TraceGroupId).IsRequired(false);
        builder.HasMany(x => x.TraceResources).WithOne(x => x.Trace).HasForeignKey(x => x.TraceId);
        builder.HasMany(x => x.TraceScopes).WithOne(x => x.Trace).HasForeignKey(x => x.TraceId);
    }
}
