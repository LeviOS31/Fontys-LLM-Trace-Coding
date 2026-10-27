using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Judge.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAxialCodeIDFromJudge : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AxialCodeId",
                table: "JudgeRuns");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AxialCodeId",
                table: "JudgeRuns",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }
    }
}
