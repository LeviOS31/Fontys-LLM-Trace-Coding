using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Traces.Enums;

namespace Traces.Data.Models;

public class TraceGroup
{
    public required Guid TraceGroupId { get; init; }
    public ICollection<Trace> Traces { get; init; }
    public required TraceGroupType TraceGroupType { get; init; }
}

internal sealed class TraceGroupEntityConfiguration : IEntityTypeConfiguration<TraceGroup>
{
    public void Configure(EntityTypeBuilder<TraceGroup> builder)
    {
        builder.HasKey(x => x.TraceGroupId);
        builder.HasMany(x => x.Traces).WithOne().HasForeignKey(x => x.TraceGroupId);
        builder.Property(x => x.TraceGroupType);
    }
}
