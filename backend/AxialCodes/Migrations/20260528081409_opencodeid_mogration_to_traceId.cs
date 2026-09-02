using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AxialCodes.Migrations
{
    /// <inheritdoc />
    public partial class opencodeid_mogration_to_traceId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "OpenCodeIds",
                table: "AxialCode",
                newName: "TraceIds");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TraceIds",
                table: "AxialCode",
                newName: "OpenCodeIds");
        }
    }
}
