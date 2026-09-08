using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Traces.Migrations
{
    /// <inheritdoc />
    public partial class addspankind : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SpanKind",
                table: "TraceScopeSpans",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SpanKind",
                table: "TraceScopeSpans");
        }
    }
}
