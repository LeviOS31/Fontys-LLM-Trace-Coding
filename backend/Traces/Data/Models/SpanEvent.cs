using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Traces.Data.Models;

public class SpanEvent
{
    public required Guid EventId { get; init; }
    public required Guid SpanId { get; init; }
    public TraceScopeSpan TraceScopeSpan { get; init; }
    public required ulong TimeUnixNano { get; init; }
    public required string Name { get; init; }
    public ICollection<SpanEventAttribute> SpanEventAttributes { get; init; }
}

internal sealed class SpanEventEntityConfiguration : IEntityTypeConfiguration<SpanEvent>
{
    public void Configure(EntityTypeBuilder<SpanEvent> builder)
    {
        builder.HasKey(x => x.EventId);
        builder.Property(x => x.SpanId);
        builder.HasOne(x => x.TraceScopeSpan).WithMany(x => x.SpanEvents).HasForeignKey(x => x.SpanId);
        builder.Property(x => x.TimeUnixNano);
        builder.Property(x => x.Name).HasMaxLength(256);
        builder.HasMany(x => x.SpanEventAttributes).WithOne(x => x.SpanEvent).HasForeignKey(x => x.SpanEventId);
    }
}
