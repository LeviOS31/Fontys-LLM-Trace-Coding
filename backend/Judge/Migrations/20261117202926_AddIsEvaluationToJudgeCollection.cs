using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Judge.Migrations
{
    /// <inheritdoc />
    public partial class AddIsEvaluationToJudgeCollection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsEvaluation",
                table: "JudgeCollections",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsEvaluation",
                table: "JudgeCollections");
        }
    }
}
