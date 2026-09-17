using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Projects.Data.Models
{
    public class ProjectVersion
    {
        public const int MinNameLength = 1;
        public const int MaxNameLength = 64;
        public const int MaxDescriptionLength = 256;

        public required Guid VersionId { get; init; }
        public required Guid ProjectId { get; init; }
        public Project project { get; init; }
        public required string Name { get; set; }
        public required string Description { get; set; }
    }

    internal sealed class ProjectVersionEntityConfiguration: IEntityTypeConfiguration<ProjectVersion>
    {
        public void Configure(EntityTypeBuilder<ProjectVersion> builder)
        {
            builder.HasKey(x => x.VersionId);
            builder.Property(x => x.Name).IsRequired().HasMaxLength(ProjectVersion.MaxNameLength);
            builder.Property(x => x.Description).IsRequired().HasMaxLength(ProjectVersion.MaxDescriptionLength);
            builder.Property(x => x.ProjectId).IsRequired();
            builder.HasOne(x => x.project).WithMany(x => x.versions).HasForeignKey(x => x.ProjectId).IsRequired();
        }
    }
}
