using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Judge.Migrations
{
    /// <inheritdoc />
    public partial class AddJudgeCollectionTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JudgeRuns_ProjectId_ProjectVersionId_CreatedAt",
                table: "JudgeRuns");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "JudgeRuns");

            migrationBuilder.RenameColumn(
                name: "ProjectVersionId",
                table: "JudgeRuns",
                newName: "JudgeCollectionId");

            migrationBuilder.CreateTable(
                name: "JudgeCollections",
                columns: table => new
                {
                    JudgeCollectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProjectVersionId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JudgeCollections", x => x.JudgeCollectionId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JudgeRuns_JudgeCollectionId",
                table: "JudgeRuns",
                column: "JudgeCollectionId");

            migrationBuilder.AddForeignKey(
                name: "FK_JudgeRuns_JudgeCollections_JudgeCollectionId",
                table: "JudgeRuns",
                column: "JudgeCollectionId",
                principalTable: "JudgeCollections",
                principalColumn: "JudgeCollectionId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JudgeRuns_JudgeCollections_JudgeCollectionId",
                table: "JudgeRuns");

            migrationBuilder.DropTable(
                name: "JudgeCollections");

            migrationBuilder.DropIndex(
                name: "IX_JudgeRuns_JudgeCollectionId",
                table: "JudgeRuns");

            migrationBuilder.RenameColumn(
                name: "JudgeCollectionId",
                table: "JudgeRuns",
                newName: "ProjectVersionId");

            migrationBuilder.AddColumn<Guid>(
                name: "ProjectId",
                table: "JudgeRuns",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_JudgeRuns_ProjectId_ProjectVersionId_CreatedAt",
                table: "JudgeRuns",
                columns: new[] { "ProjectId", "ProjectVersionId", "CreatedAt" },
                descending: new[] { false, false, true });
        }
    }
}
