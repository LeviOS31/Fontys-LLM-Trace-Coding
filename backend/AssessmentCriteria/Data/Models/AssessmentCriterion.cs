using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssessmentCriteria.Data.Models;

public class AssessmentCriterion
{
    public const int MinLength = 1;
    public const int MaxLength = 256;

    public required Guid CriterionId { get; set; }
    public required Guid ProjectId { get; set; }
    public required string Criterion { get; set; }
}

internal sealed class AssessmentCriterionEntityConfiguration : IEntityTypeConfiguration<AssessmentCriterion>
{
    public void Configure(EntityTypeBuilder<AssessmentCriterion> builder)
    {
        builder.HasKey(x => x.CriterionId);
        builder.Property(x => x.Criterion).HasMaxLength(AssessmentCriterion.MaxLength);
        builder.Property(x => x.ProjectId).IsRequired();
    }
}
