using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AxialCodes.Data.Models;

public class AxialCode
{
    public const int MaxLabelLength = 255;
    public const int MaxDescriptionLength = 255;
    public const int MaxFeedbackLength = 1000;
    public const int MaxJudgeGuidelinesLength = 2000;

    public required Guid AxialCodingResultId { get; init; }
    public required AxialCodingResult? AxialCodingResult { get; init; }

    public required Guid AxialCodeId { get; init; }
    public required string Label { get; init; }
    public required string Description { get; init; }
    public required ICollection<Guid> TraceIds { get; init; }

    // Guidelines a judge can apply to an unseen trace to decide whether it shows this behaviour,
    // derived from the grouped open codes. Null for results generated before they existed.
    public string? JudgeGuidelines { get; init; }

    // Why each grouped open code belongs to this axial code.
    public ICollection<AxialCodeOpenCodeJustification> OpenCodeJustifications { get; init; } = [];

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
        builder.Property(x => x.JudgeGuidelines).HasMaxLength(AxialCode.MaxJudgeGuidelinesLength);

        builder.PrimitiveCollection(x => x.TraceIds);

        builder
            .HasMany(x => x.OpenCodeJustifications)
            .WithOne(x => x.AxialCode)
            .HasForeignKey(x => x.AxialCodeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
