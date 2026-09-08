using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Traces.Migrations
{
    /// <inheritdoc />
    public partial class add_trace_updated_at : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Traces",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Traces");
        }
    }
}
