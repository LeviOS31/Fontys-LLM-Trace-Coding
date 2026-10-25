using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AxialCodes.Data.Models;

public class AxialCodeOpenCodeJustification
{
    public const int MaxQuoteLength = 500;
    public const int MaxJustificationLength = 1000;

    public required Guid AxialCodeId { get; init; }
    public AxialCode? AxialCode { get; init; }

    // Open codes are stored on their trace, so the trace id identifies the open code.
    public required Guid TraceId { get; init; }

    // Exact excerpt of the open code that supports the grouping.
    public required string Quote { get; init; }

    // Why the open code belongs to the axial code.
    public required string Justification { get; init; }
}

internal sealed class AxialCodeOpenCodeJustificationEntityConfiguration
    : IEntityTypeConfiguration<AxialCodeOpenCodeJustification>
{
    public void Configure(EntityTypeBuilder<AxialCodeOpenCodeJustification> builder)
    {
        builder.HasKey(x => new { x.AxialCodeId, x.TraceId });

        builder.Property(x => x.Quote).HasMaxLength(AxialCodeOpenCodeJustification.MaxQuoteLength);
        builder.Property(x => x.Justification).HasMaxLength(AxialCodeOpenCodeJustification.MaxJustificationLength);
    }
}
