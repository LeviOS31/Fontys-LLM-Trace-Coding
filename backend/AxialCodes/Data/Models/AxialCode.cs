using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AxialCodes.Data.Models;

public class AxialCode
{

        public required Guid AxialCodingResultId { get; init; }
        public required AxialCodingResult? AxialCodingResult { get; init; }

        public required Guid AxialCodeId { get; init; }
        public required string Label { get; init; }
        public required string Description { get; init; }
        public required ICollection<Guid> TraceIds { get; init; }

        // Why this axial code was created, based on its grouped open codes. Null for results generated before it existed.
        public string? Rationale { get; init; }

        // Guidelines a judge can apply to an unseen trace to decide whether it shows this behaviour,
        // derived from the grouped open codes. Null for results generated before they existed.
        public string? JudgeGuidelines { get; init; }

        // Excerpts of real traces used as examples in the judge prompt, with the reasoning for each verdict.
        // Null for results generated before they existed, or when no valid example could be selected.
        public string? PositiveExampleTrace { get; init; }
        public string? PositiveExampleReasoning { get; init; }
        public string? NegativeExampleTrace { get; init; }
        public string? NegativeExampleReasoning { get; init; }

        // Why each grouped open code belongs to this axial code.
        public ICollection<AxialCodeOpenCodeJustification> OpenCodeJustifications { get; init; } = [];

        public string? Feedback { get; set; }
}

internal sealed class AxialCodeEntityConfiguration : IEntityTypeConfiguration<AxialCode>
{
        public void Configure(EntityTypeBuilder<AxialCode> builder)
        {
                builder.HasKey(x => x.AxialCodeId);

                builder.Property(x => x.Label);
                builder.Property(x => x.Description);
                builder.Property(x => x.Feedback);
                builder.Property(x => x.JudgeGuidelines);

                builder.PrimitiveCollection(x => x.TraceIds);

                builder
                    .HasMany(x => x.OpenCodeJustifications)
                    .WithOne(x => x.AxialCode)
                    .HasForeignKey(x => x.AxialCodeId)
                    .OnDelete(DeleteBehavior.Cascade);
        }
}