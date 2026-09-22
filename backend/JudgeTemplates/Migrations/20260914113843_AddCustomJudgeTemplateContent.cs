using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JudgeTemplates.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomJudgeTemplateContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomJudgeTemplateContent",
                table: "JudgeTemplates",
                type: "text",
                maxLength: 2147483647,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomJudgeTemplateContent",
                table: "JudgeTemplates");
        }
    }
}
