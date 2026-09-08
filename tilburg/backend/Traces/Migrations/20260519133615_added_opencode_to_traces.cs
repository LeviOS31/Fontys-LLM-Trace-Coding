using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Traces.Migrations
{
    /// <inheritdoc />
    public partial class added_opencode_to_traces : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasOpencode",
                table: "Traces");

            migrationBuilder.AddColumn<Guid>(
                name: "AxialCodeId",
                table: "Traces",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OpenCode",
                table: "Traces",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AxialCodeId",
                table: "Traces");

            migrationBuilder.DropColumn(
                name: "OpenCode",
                table: "Traces");

            migrationBuilder.AddColumn<bool>(
                name: "HasOpencode",
                table: "Traces",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
