using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AxialCodes.Migrations
{
    /// <inheritdoc />
    public partial class AddAxialCodeRationale : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Rationale",
                table: "AxialCode",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Rationale",
                table: "AxialCode");
        }
    }
}
