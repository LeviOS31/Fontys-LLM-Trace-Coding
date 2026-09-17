using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Traces.Migrations
{
    /// <inheritdoc />
    public partial class removedduplicateTraceGroupID : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Traces_TraceGroups_TraceGroupId1",
                table: "Traces");

            migrationBuilder.DropIndex(
                name: "IX_Traces_TraceGroupId1",
                table: "Traces");

            migrationBuilder.DropColumn(
                name: "TraceGroupId1",
                table: "Traces");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TraceGroupId1",
                table: "Traces",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Traces_TraceGroupId1",
                table: "Traces",
                column: "TraceGroupId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Traces_TraceGroups_TraceGroupId1",
                table: "Traces",
                column: "TraceGroupId1",
                principalTable: "TraceGroups",
                principalColumn: "TraceGroupId");
        }
    }
}
