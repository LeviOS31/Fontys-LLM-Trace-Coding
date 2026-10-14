using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AxialCodes.Data.Models;

public class AxialCodeTraceJustification
{
    public const int MaxQuoteLength = 500;
    public const int MaxJustificationLength = 1000;

    public required Guid AxialCodeId { get; init; }
    public AxialCode? AxialCode { get; init; }

    public required Guid TraceId { get; init; }

    // Exact excerpt of the trace's open code that supports the categorisation.
    public required string Quote { get; init; }

    // Why the trace fits the axial code.
    public required string Justification { get; init; }
}

internal sealed class AxialCodeTraceJustificationEntityConfiguration
    : IEntityTypeConfiguration<AxialCodeTraceJustification>
{
    public void Configure(EntityTypeBuilder<AxialCodeTraceJustification> builder)
    {
        builder.HasKey(x => new { x.AxialCodeId, x.TraceId });

        builder.Property(x => x.Quote).HasMaxLength(AxialCodeTraceJustification.MaxQuoteLength);
        builder.Property(x => x.Justification).HasMaxLength(AxialCodeTraceJustification.MaxJustificationLength);
    }
}
