using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Traces.Enums;

namespace Traces.Data.Models;

public class SpanEventAttribute
{
    public required Guid SpanEventId { get; init; }
    public SpanEvent SpanEvent { get; init; }
    public required string Key { get; init; }
    public required string Value { get; init; }
    public required TraceAttributeType TraceAttributeType { get; init; }
}

internal sealed class SpanEventAttributeEntityConfiguration : IEntityTypeConfiguration<SpanEventAttribute>
{
    public void Configure(EntityTypeBuilder<SpanEventAttribute> builder)
    {
        builder.Property(x => x.SpanEventId);
        builder.HasOne(x => x.SpanEvent).WithMany(x => x.SpanEventAttributes).HasForeignKey(x => x.SpanEventId);
        builder.Property(x => x.Key).HasMaxLength(256);
        builder.Property(x => x.Value).HasMaxLength(2560);
        builder.Property(x => x.TraceAttributeType);

        builder.HasKey(x => new { x.SpanEventId, x.Key });
    }
}
