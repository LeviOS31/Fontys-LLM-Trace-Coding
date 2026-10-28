using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Judge.Migrations
{
    /// <inheritdoc />
    public partial class InitialJudgeRun : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JudgeRuns",
                columns: table => new
                {
                    JudgeRunId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    AxialCodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResultsJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JudgeRuns", x => x.JudgeRunId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JudgeRuns");
        }
    }
}
