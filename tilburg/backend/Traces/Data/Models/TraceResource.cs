using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Traces.Enums;

namespace Traces.Data.Models;

public class TraceResource
{
    public required Guid TraceId { get; init; }
    public Trace Trace { get; init; }
    public required string Key { get; init; }
    public required string Value { get; init; }
    public required TraceAttributeType TraceAttributeType { get; init; }
}

internal sealed class TraceResourceEntityConfiguration : IEntityTypeConfiguration<TraceResource>
{
    public void Configure(EntityTypeBuilder<TraceResource> builder)
    {
        builder.Property(x => x.TraceId);
        builder.HasOne(t => t.Trace).WithMany(x => x.TraceResources).HasForeignKey(x => x.TraceId);
        builder.Property(x => x.Key).HasMaxLength(255);
        builder.Property(x => x.Value).HasMaxLength(32768);
        builder.Property(x => x.TraceAttributeType);

        builder.HasKey(x => new { x.TraceId, x.Key });
    }
}
