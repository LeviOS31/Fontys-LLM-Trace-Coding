using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Traces.Data.Models;

public class TraceCollection
{
    public const int MinNameLength = 3;
    public const int MaxNameLength = 64;

    public required Guid TraceCollectionId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required string Name { get; set; }
    public required DateTime CreatedAt { get; init; }
    public required ICollection<Trace> Traces { get; init; }
}

internal sealed class TraceCollectionEntityConfiguration : IEntityTypeConfiguration<TraceCollection>
{
    public void Configure(EntityTypeBuilder<TraceCollection> builder)
    {
        builder.HasKey(x => x.TraceCollectionId);
        builder.Property(x => x.ProjectVersionId);
        builder.Property(x => x.Name).HasMaxLength(TraceCollection.MaxNameLength);
        builder.Property(x => x.CreatedAt);
        builder.HasMany(x => x.Traces).WithOne(x => x.TraceCollection).HasForeignKey(x => x.TraceCollectionId);
    }
}
