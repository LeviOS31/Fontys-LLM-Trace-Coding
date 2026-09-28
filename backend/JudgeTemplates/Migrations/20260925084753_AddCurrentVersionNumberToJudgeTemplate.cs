using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JudgeTemplates.Migrations
{
    /// <inheritdoc />
    public partial class AddCurrentVersionNumberToJudgeTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CurrentVersionNumber",
                table: "JudgeTemplates",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentVersionNumber",
                table: "JudgeTemplates");
        }
    }
}
