using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AxialCodes.Data.Models;

public class AxialCode
{
    public const int MaxLabelLength = 255;
    public const int MaxDescriptionLength = 255;

    public required Guid AxialCodingResultId { get; init; }
    public required AxialCodingResult? AxialCodingResult { get; init; }

    public required Guid AxialCodeId { get; init; }
    public required string Label { get; init; }
    public required string Description { get; init; }
    public required ICollection<Guid> TraceIds { get; init; }
}

internal sealed class AxialCodeEntityConfiguration : IEntityTypeConfiguration<AxialCode>
{
    public void Configure(EntityTypeBuilder<AxialCode> builder)
    {
        builder.HasKey(x => x.AxialCodeId);

        builder.Property(x => x.Label).HasMaxLength(AxialCode.MaxLabelLength);
        builder.Property(x => x.Description).HasMaxLength(AxialCode.MaxDescriptionLength);

        builder.PrimitiveCollection(x => x.TraceIds);
    }
}
