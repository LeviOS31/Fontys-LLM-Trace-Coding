using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Settings.Migrations
{
    /// <inheritdoc />
    public partial class SeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "ChatClientConfigurations",
                columns: new[] { "UserId", "Endpoint", "Model", "Provider" },
                values: new object[] { new Guid("ec1145a3-869d-4b06-b4ae-7308d85839b7"), "http://localhost:11434/", "gpt-oss:120b-cloud", "ollama" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ChatClientConfigurations",
                keyColumn: "UserId",
                keyValue: new Guid("ec1145a3-869d-4b06-b4ae-7308d85839b7"));
        }
    }
}
