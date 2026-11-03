using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Judge.Data.Models;

public class JudgeRun
{
    public required Guid JudgeRunId { get; init; }
    public required Guid JudgeCollectionId { get; init; }
    public JudgeCollection JudgeCollection { get; init; }
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
        builder.HasOne(x => x.JudgeCollection).WithMany(x => x.judgeRuns).HasForeignKey(x => x.JudgeCollectionId).IsRequired();
    }
}