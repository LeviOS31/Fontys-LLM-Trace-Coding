using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AxialCodes.Migrations
{
    /// <inheritdoc />
    public partial class AddAxialCodeExamples : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NegativeExampleReasoning",
                table: "AxialCode",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NegativeExampleTrace",
                table: "AxialCode",
                type: "character varying(1100)",
                maxLength: 1100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PositiveExampleReasoning",
                table: "AxialCode",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PositiveExampleTrace",
                table: "AxialCode",
                type: "character varying(1100)",
                maxLength: 1100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NegativeExampleReasoning",
                table: "AxialCode");

            migrationBuilder.DropColumn(
                name: "NegativeExampleTrace",
                table: "AxialCode");

            migrationBuilder.DropColumn(
                name: "PositiveExampleReasoning",
                table: "AxialCode");

            migrationBuilder.DropColumn(
                name: "PositiveExampleTrace",
                table: "AxialCode");
        }
    }
}
