using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Judge.Migrations
{
    /// <inheritdoc />
    public partial class AddJudgeRunSummaryAndIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FailedCount",
                table: "JudgeRuns",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FalseCount",
                table: "JudgeRuns",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalCount",
                table: "JudgeRuns",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TrueCount",
                table: "JudgeRuns",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FailedCount",
                table: "JudgeRuns");

            migrationBuilder.DropColumn(
                name: "FalseCount",
                table: "JudgeRuns");

            migrationBuilder.DropColumn(
                name: "TotalCount",
                table: "JudgeRuns");

            migrationBuilder.DropColumn(
                name: "TrueCount",
                table: "JudgeRuns");
        }
    }
}
