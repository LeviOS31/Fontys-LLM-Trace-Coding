using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shared.Interfaces;

namespace Projects.Data.Models;

public class Project : IUserOwned
{
    public const int MinNameLength = 3;
    public const int MaxNameLength = 64;
    public const int MaxDescriptionLength = 256;

    public required Guid ProjectId { get; set; }
    public required Guid UserId { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
}

internal sealed class ProjectEntityConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.HasKey(x => x.ProjectId);
        builder.Property(x => x.Name).HasMaxLength(Project.MaxNameLength);
        builder.Property(x => x.Description).HasMaxLength(Project.MaxDescriptionLength);
    }
}
