using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AxialCodes.Migrations
{
    /// <inheritdoc />
    public partial class AddAxialCodeFeedback : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Feedback",
                table: "AxialCode",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Feedback",
                table: "AxialCode");
        }
    }
}
