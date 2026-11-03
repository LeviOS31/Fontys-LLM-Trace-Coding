using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Judge.Data.Models
{
    public class JudgeCollection
    {
        public required Guid JudgeCollectionId { get; init; }
        public required Guid ProjectVersionId { get; init; }
        public required ICollection<JudgeRun> judgeRuns { get; init; }
    }

    internal sealed class JudgeCollectionEntityConfiguration: IEntityTypeConfiguration<JudgeCollection>
    {
        public void Configure(EntityTypeBuilder<JudgeCollection> builder)
        {
            builder.HasKey(x => x.JudgeCollectionId);
            builder.HasMany(x => x.judgeRuns).WithOne(x => x.JudgeCollection).HasForeignKey(x => x.JudgeCollectionId);
        }
    }
}
