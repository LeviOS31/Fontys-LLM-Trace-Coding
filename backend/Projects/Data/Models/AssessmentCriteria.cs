using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Text;

namespace Projects.Data.Models
{
    public class AssessmentCriteria
    {
        public const int MinLength = 1;
        public const int MaxLength = 256;

        public required Guid CriteriaId { get; init; }
        public required Guid ProjectId { get; init; }
        public Project project { get; init; }
        public required string Criteria { get; init; }
    }

    internal sealed class AssessmentCriteriaEntityConfiguration : IEntityTypeConfiguration<AssessmentCriteria>
    {
        public void Configure(EntityTypeBuilder<AssessmentCriteria> builder)
        {
            builder.HasKey(x => x.CriteriaId);
            builder.Property(x => x.Criteria).HasMaxLength(AssessmentCriteria.MaxLength);
            builder.Property(x => x.ProjectId).IsRequired();
            builder.HasOne(x => x.project).WithMany(x => x.AssessmentCriteria).HasForeignKey(x => x.ProjectId).IsRequired();
            builder.HasOne<Project>().WithMany(x => x.AssessmentCriteria).HasForeignKey(x => x.ProjectId).IsRequired();
        }
    }
}
