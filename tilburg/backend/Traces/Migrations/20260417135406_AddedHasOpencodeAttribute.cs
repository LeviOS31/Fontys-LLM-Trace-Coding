using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Traces.Migrations
{
    /// <inheritdoc />
    public partial class AddedHasOpencodeAttribute : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasOpencode",
                table: "Traces",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasOpencode",
                table: "Traces");
        }
    }
}
