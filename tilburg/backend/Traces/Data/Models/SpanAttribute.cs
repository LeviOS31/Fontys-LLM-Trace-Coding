using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Traces.Enums;

namespace Traces.Data.Models;

public class SpanAttribute
{
    public required Guid SpanId { get; init; }
    public TraceScopeSpan TraceScopeSpan { get; init; }
    public required string Key { get; init; }
    public required string Value { get; init; }
    public required TraceAttributeType TraceAttributeType { get; init; }
}

internal sealed class SpanAttributeEntityConfiguration : IEntityTypeConfiguration<SpanAttribute>
{
    public void Configure(EntityTypeBuilder<SpanAttribute> builder)
    {
        builder.Property(x => x.SpanId);
        builder.HasOne(x => x.TraceScopeSpan).WithMany(x => x.SpanAttributes).HasForeignKey(x => x.SpanId);
        builder.Property(x => x.Key).HasMaxLength(256);
        builder.Property(x => x.Value).HasMaxLength(2560);
        builder.Property(x => x.TraceAttributeType);

        builder.HasKey(x => new { x.SpanId, x.Key });
    }
}
