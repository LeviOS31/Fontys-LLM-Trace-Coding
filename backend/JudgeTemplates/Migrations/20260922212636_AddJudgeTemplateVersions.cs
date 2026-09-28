using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JudgeTemplates.Migrations
{
    /// <inheritdoc />
    public partial class AddJudgeTemplateVersions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JudgeTemplateVersions",
                columns: table => new
                {
                    JudgeTemplateVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    JudgeTemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    VersionNumber = table.Column<int>(type: "integer", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JudgeTemplateVersions", x => x.JudgeTemplateVersionId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JudgeTemplateVersions_JudgeTemplateId_VersionNumber",
                table: "JudgeTemplateVersions",
                columns: new[] { "JudgeTemplateId", "VersionNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JudgeTemplateVersions");
        }
    }
}
