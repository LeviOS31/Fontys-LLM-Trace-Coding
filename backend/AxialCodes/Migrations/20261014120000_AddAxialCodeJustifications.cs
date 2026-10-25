using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AxialCodes.Migrations
{
    /// <inheritdoc />
    public partial class AddAxialCodeJustifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InclusionCriteria",
                table: "AxialCode",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AxialCodeTraceJustification",
                columns: table => new
                {
                    AxialCodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    TraceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Justification = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AxialCodeTraceJustification", x => new { x.AxialCodeId, x.TraceId });
                    table.ForeignKey(
                        name: "FK_AxialCodeTraceJustification_AxialCode_AxialCodeId",
                        column: x => x.AxialCodeId,
                        principalTable: "AxialCode",
                        principalColumn: "AxialCodeId",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AxialCodeTraceJustification");

            migrationBuilder.DropColumn(
                name: "InclusionCriteria",
                table: "AxialCode");
        }
    }
}
