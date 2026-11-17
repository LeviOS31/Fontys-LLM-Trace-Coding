using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Settings.Migrations
{
    /// <inheritdoc />
    public partial class AddedAPIkey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApiKey",
                table: "ChatClientConfigurations",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ChatClientConfigurations",
                keyColumn: "UserId",
                keyValue: new Guid("ec1145a3-869d-4b06-b4ae-7308d85839b7"),
                column: "ApiKey",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApiKey",
                table: "ChatClientConfigurations");
        }
    }
}
