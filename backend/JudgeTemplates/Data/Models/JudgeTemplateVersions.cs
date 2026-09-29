using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JudgeTemplates.Data.Models;

public class JudgeTemplateVersion
{
    public Guid JudgeTemplateVersionId { get; set; }
    public Guid JudgeTemplateId { get; set; }
    public int VersionNumber { get; set; }
    public required string Content { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

internal sealed class JudgeTemplateVersionEntityConfiguration : IEntityTypeConfiguration<JudgeTemplateVersion>
{
    public void Configure(EntityTypeBuilder<JudgeTemplateVersion> builder)
    {
        builder.HasKey(x => x.JudgeTemplateVersionId);
        builder.HasIndex(x => new { x.JudgeTemplateId, x.VersionNumber }).IsUnique();
    }
}