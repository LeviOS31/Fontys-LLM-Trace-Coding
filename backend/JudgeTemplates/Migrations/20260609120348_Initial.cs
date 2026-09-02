using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JudgeTemplates.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JudgeTemplates",
                columns: table => new
                {
                    JudgeTemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    JudgeTemplateName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    JudgeTemplateDescription = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    AxialCodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsDeprecated = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JudgeTemplates", x => x.JudgeTemplateId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JudgeTemplates");
        }
    }
}
