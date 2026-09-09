using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Traces.Data.Models;

public class TraceScope
{
    public required Guid TraceScopeId { get; init; }
    public required Guid TraceId { get; init; }
    public Trace Trace { get; init; }
    public required string Name { get; init; }
    public required string Version { get; init; }
    public ICollection<TraceScopeSpan> TraceScopeSpans { get; init; }
}

internal sealed class TraceScopesEntityConfiguration : IEntityTypeConfiguration<TraceScope>
{
    public void Configure(EntityTypeBuilder<TraceScope> builder)
    {
        builder.HasKey(x => x.TraceScopeId);
        builder.Property(x => x.TraceId);
        builder.HasOne(x => x.Trace).WithMany(x => x.TraceScopes).HasForeignKey(x => x.TraceId);
        builder.Property(x => x.Name).HasMaxLength(256);
        builder.Property(x => x.Version).HasMaxLength(16384);
        builder.HasMany(x => x.TraceScopeSpans).WithOne(x => x.TraceScope).HasForeignKey(x => x.TraceScopeId);
    }
}
