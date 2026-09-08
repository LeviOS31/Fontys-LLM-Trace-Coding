using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JudgeTemplates.Data.Models;

public class JudgeTemplate
{
    public const int MaxNameLength = 255;
    public const int MaxDescriptionLength = 255;
    public Guid JudgeTemplateId { get; set; }

    [MaxLength(MaxNameLength)]
    public required string JudgeTemplateName { get; set; }

    [MaxLength(MaxDescriptionLength)]
    public required string JudgeTemplateDescription { get; set; }
    public Guid AxialCodeId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid ProjectVersionId { get; set; }
    public bool IsDeprecated { get; set; }
}

internal sealed class JudgeTemplateEntityConfiguration : IEntityTypeConfiguration<JudgeTemplate>
{
    public void Configure(EntityTypeBuilder<JudgeTemplate> builder)
    {
        builder.HasKey(x => x.JudgeTemplateId);
        builder.Property(x => x.JudgeTemplateName).HasMaxLength(JudgeTemplate.MaxNameLength);
        builder.Property(x => x.JudgeTemplateDescription).HasMaxLength(JudgeTemplate.MaxDescriptionLength);
    }
}
