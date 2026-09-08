using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Traces.Enums;

namespace Traces.Data.Models;

public class TraceScopeSpan
{
    public required Guid TraceScopeSpanId { get; init; }
    public required Guid TraceScopeId { get; init; }
    public TraceScope TraceScope { get; init; }
    public Guid? ParentSpanId { get; set; }
    public required string Name { get; init; }
    public required ulong StartTimeUnixNano { get; init; }
    public required ulong EndTimeUnixNano { get; init; }
    public ICollection<SpanAttribute> SpanAttributes { get; init; }
    public ICollection<SpanEvent> SpanEvents { get; init; }
    public required SpanKind SpanKind { get; init; }
}

internal sealed class TraceScopeEntityConfiguration : IEntityTypeConfiguration<TraceScopeSpan>
{
    public void Configure(EntityTypeBuilder<TraceScopeSpan> builder)
    {
        builder.HasKey(x => x.TraceScopeSpanId);
        builder.Property(x => x.TraceScopeSpanId);
        builder.HasOne(x => x.TraceScope).WithMany(x => x.TraceScopeSpans).HasForeignKey(x => x.TraceScopeId);
        builder.Property(x => x.ParentSpanId).IsRequired(false);
        builder.Property(x => x.Name).HasMaxLength(256);
        builder.Property(x => x.StartTimeUnixNano);
        builder.Property(x => x.EndTimeUnixNano);
        builder.HasMany(x => x.SpanAttributes).WithOne(x => x.TraceScopeSpan).HasForeignKey(x => x.SpanId);
        builder.HasMany(x => x.SpanEvents).WithOne(x => x.TraceScopeSpan).HasForeignKey(x => x.SpanId);
    }
}
