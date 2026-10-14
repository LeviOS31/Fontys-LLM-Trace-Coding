using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AxialCodes.Data.Models;

public class AxialCode
{
    public const int MaxLabelLength = 255;
    public const int MaxDescriptionLength = 255;
    public const int MaxFeedbackLength = 1000;
    public const int MaxInclusionCriteriaLength = 500;

    public required Guid AxialCodingResultId { get; init; }
    public required AxialCodingResult? AxialCodingResult { get; init; }

    public required Guid AxialCodeId { get; init; }
    public required string Label { get; init; }
    public required string Description { get; init; }
    public required ICollection<Guid> TraceIds { get; init; }

    // When a trace belongs to this axial code. Null for results generated before justifications existed.
    public string? InclusionCriteria { get; init; }

    // Why each trace in TraceIds belongs to this axial code.
    public ICollection<AxialCodeTraceJustification> TraceJustifications { get; init; } = [];

    public string? Feedback { get; set; }
}

internal sealed class AxialCodeEntityConfiguration : IEntityTypeConfiguration<AxialCode>
{
    public void Configure(EntityTypeBuilder<AxialCode> builder)
    {
        builder.HasKey(x => x.AxialCodeId);

        builder.Property(x => x.Label).HasMaxLength(AxialCode.MaxLabelLength);
        builder.Property(x => x.Description).HasMaxLength(AxialCode.MaxDescriptionLength);
        builder.Property(x => x.Feedback).HasMaxLength(AxialCode.MaxFeedbackLength);
        builder.Property(x => x.InclusionCriteria).HasMaxLength(AxialCode.MaxInclusionCriteriaLength);

        builder.PrimitiveCollection(x => x.TraceIds);

        builder
            .HasMany(x => x.TraceJustifications)
            .WithOne(x => x.AxialCode)
            .HasForeignKey(x => x.AxialCodeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
