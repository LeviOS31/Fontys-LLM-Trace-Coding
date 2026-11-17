using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JudgeTemplates.Data.Models;

public class JudgeTemplate
{
    public Guid JudgeTemplateId { get; set; }

    public required string JudgeTemplateName { get; set; }

    public required string JudgeTemplateDescription { get; set; }
    public required Guid AxialCodeId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid ProjectVersionId { get; set; }
    public bool IsDeprecated { get; set; }

    public int? CurrentVersionNumber { get; set; }

    // Null = still using the auto-generated template from the axial code.
    // Set once a user saves an edit; unbounded, since prompt text with
    // examples/notes can run long.
    public string? CustomJudgeTemplateContent { get; set; }
}

internal sealed class JudgeTemplateEntityConfiguration : IEntityTypeConfiguration<JudgeTemplate>
{
    public void Configure(EntityTypeBuilder<JudgeTemplate> builder)
    {
        builder.HasKey(x => x.JudgeTemplateId);
        builder.Property(x => x.JudgeTemplateName);
        builder.Property(x => x.JudgeTemplateDescription);
        builder.Property(x => x.CustomJudgeTemplateContent).HasMaxLength(int.MaxValue);
    }
}
