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
    public required int TotalCount { get; init; }
    public required int TrueCount { get; init; }
    public required int FalseCount { get; init; }
    public required int FailedCount { get; init; }
}

internal sealed class JudgeRunEntityConfiguration : IEntityTypeConfiguration<JudgeRun>
{
    public void Configure(EntityTypeBuilder<JudgeRun> builder)
    {
        builder.HasKey(x => x.JudgeRunId);

        builder
            .HasIndex(x => new { x.ProjectId, x.ProjectVersionId, x.CreatedAt })
            .IsDescending(false, false, true);
    }
}