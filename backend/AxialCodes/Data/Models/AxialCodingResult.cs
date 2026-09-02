using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AxialCodes.Data.Models;

public class AxialCodingResult
{
    public required Guid AxialCodingResultId { get; init; }
    public required Guid ProjectVersionId { get; init; }
    public required bool IsActive { get; set; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required IEnumerable<AxialCode> AxialCodes { get; init; }
}

internal sealed class AxialCodingResultEntityConfiguration : IEntityTypeConfiguration<AxialCodingResult>
{
    public void Configure(EntityTypeBuilder<AxialCodingResult> builder)
    {
        builder.HasKey(x => x.AxialCodingResultId);

        builder.HasIndex(x => new { x.ProjectVersionId, x.IsActive }).IsUnique().HasFilter("\"IsActive\" = true");

        builder.HasMany(x => x.AxialCodes).WithOne(x => x.AxialCodingResult).HasForeignKey(x => x.AxialCodingResultId);
    }
}
