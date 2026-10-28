using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Judge.Data.Models;

public class JudgeRun
{
    public required Guid JudgeRunId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required string ResultsJson { get; set; }
    public required DateTimeOffset CreatedAt { get; init; }
}

internal sealed class JudgeRunEntityConfiguration : IEntityTypeConfiguration<JudgeRun>
{
    public void Configure(EntityTypeBuilder<JudgeRun> builder)
    {
        builder.HasKey(x => x.JudgeRunId);
    }
}