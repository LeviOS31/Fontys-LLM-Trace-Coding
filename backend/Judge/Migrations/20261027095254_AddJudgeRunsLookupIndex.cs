using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Judge.Migrations
{
    /// <inheritdoc />
    public partial class AddJudgeRunsLookupIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_JudgeRuns_ProjectId_ProjectVersionId_CreatedAt",
                table: "JudgeRuns",
                columns: new[] { "ProjectId", "ProjectVersionId", "CreatedAt" },
                descending: new[] { false, false, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JudgeRuns_ProjectId_ProjectVersionId_CreatedAt",
                table: "JudgeRuns");
        }
    }
}
