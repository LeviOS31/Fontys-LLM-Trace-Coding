using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AxialCodes.Migrations
{
    /// <inheritdoc />
    public partial class RenameJustificationsForJudgeGuidelines : Migration
    {
        // Renames instead of drop/create (what EF scaffolds) so existing justifications and criteria are kept.

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AxialCodeTraceJustification_AxialCode_AxialCodeId",
                table: "AxialCodeTraceJustification");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AxialCodeTraceJustification",
                table: "AxialCodeTraceJustification");

            migrationBuilder.RenameTable(
                name: "AxialCodeTraceJustification",
                newName: "AxialCodeOpenCodeJustification");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AxialCodeOpenCodeJustification",
                table: "AxialCodeOpenCodeJustification",
                columns: new[] { "AxialCodeId", "TraceId" });

            migrationBuilder.AddForeignKey(
                name: "FK_AxialCodeOpenCodeJustification_AxialCode_AxialCodeId",
                table: "AxialCodeOpenCodeJustification",
                column: "AxialCodeId",
                principalTable: "AxialCode",
                principalColumn: "AxialCodeId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.RenameColumn(
                name: "InclusionCriteria",
                table: "AxialCode",
                newName: "JudgeGuidelines");

            migrationBuilder.AlterColumn<string>(
                name: "JudgeGuidelines",
                table: "AxialCode",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Guidelines longer than the old limit are truncated so they fit the previous column size.
            migrationBuilder.Sql(
                "UPDATE \"AxialCode\" SET \"JudgeGuidelines\" = LEFT(\"JudgeGuidelines\", 500) WHERE LENGTH(\"JudgeGuidelines\") > 500;");

            migrationBuilder.AlterColumn<string>(
                name: "JudgeGuidelines",
                table: "AxialCode",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.RenameColumn(
                name: "JudgeGuidelines",
                table: "AxialCode",
                newName: "InclusionCriteria");

            migrationBuilder.DropForeignKey(
                name: "FK_AxialCodeOpenCodeJustification_AxialCode_AxialCodeId",
                table: "AxialCodeOpenCodeJustification");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AxialCodeOpenCodeJustification",
                table: "AxialCodeOpenCodeJustification");

            migrationBuilder.RenameTable(
                name: "AxialCodeOpenCodeJustification",
                newName: "AxialCodeTraceJustification");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AxialCodeTraceJustification",
                table: "AxialCodeTraceJustification",
                columns: new[] { "AxialCodeId", "TraceId" });

            migrationBuilder.AddForeignKey(
                name: "FK_AxialCodeTraceJustification_AxialCode_AxialCodeId",
                table: "AxialCodeTraceJustification",
                column: "AxialCodeId",
                principalTable: "AxialCode",
                principalColumn: "AxialCodeId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
