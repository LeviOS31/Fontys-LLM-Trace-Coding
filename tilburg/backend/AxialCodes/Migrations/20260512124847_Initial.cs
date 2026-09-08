using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AxialCodes.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AxialCodingResults",
                columns: table => new
                {
                    AxialCodingResultId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AxialCodingResults", x => x.AxialCodingResultId);
                });

            migrationBuilder.CreateTable(
                name: "AxialCode",
                columns: table => new
                {
                    AxialCodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    AxialCodingResultId = table.Column<Guid>(type: "uuid", nullable: false),
                    Label = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    OpenCodeIds = table.Column<Guid[]>(type: "uuid[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AxialCode", x => x.AxialCodeId);
                    table.ForeignKey(
                        name: "FK_AxialCode_AxialCodingResults_AxialCodingResultId",
                        column: x => x.AxialCodingResultId,
                        principalTable: "AxialCodingResults",
                        principalColumn: "AxialCodingResultId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AxialCode_AxialCodingResultId",
                table: "AxialCode",
                column: "AxialCodingResultId");

            migrationBuilder.CreateIndex(
                name: "IX_AxialCodingResults_ProjectVersionId_IsActive",
                table: "AxialCodingResults",
                columns: new[] { "ProjectVersionId", "IsActive" },
                unique: true,
                filter: "\"IsActive\" = true");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AxialCode");

            migrationBuilder.DropTable(
                name: "AxialCodingResults");
        }
    }
}
