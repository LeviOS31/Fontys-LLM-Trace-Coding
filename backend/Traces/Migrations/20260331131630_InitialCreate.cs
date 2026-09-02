using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Traces.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TraceCollections",
                columns: table => new
                {
                    TraceCollectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(
                        type: "character varying(64)",
                        maxLength: 64,
                        nullable: false
                    ),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TraceCollections", x => x.TraceCollectionId);
                }
            );

            migrationBuilder.CreateTable(
                name: "Traces",
                columns: table => new
                {
                    TraceId = table.Column<Guid>(type: "uuid", nullable: false),
                    TraceCollectionId = table.Column<Guid>(type: "uuid", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Traces", x => x.TraceId);
                    table.ForeignKey(
                        name: "FK_Traces_TraceCollections_TraceCollectionId",
                        column: x => x.TraceCollectionId,
                        principalTable: "TraceCollections",
                        principalColumn: "TraceCollectionId",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "TraceAttributes",
                columns: table => new
                {
                    TraceId = table.Column<Guid>(type: "uuid", nullable: false),
                    TraceAttributeType = table.Column<int>(type: "integer", nullable: false),
                    Key = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_TraceAttributes",
                        x => new
                        {
                            x.TraceId,
                            x.TraceAttributeType,
                            x.Key,
                        }
                    );
                    table.ForeignKey(
                        name: "FK_TraceAttributes_Traces_TraceId",
                        column: x => x.TraceId,
                        principalTable: "Traces",
                        principalColumn: "TraceId",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "TraceMessages",
                columns: table => new
                {
                    TraceId = table.Column<Guid>(type: "uuid", nullable: false),
                    TraceMessageType = table.Column<int>(type: "integer", nullable: false),
                    Index = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_TraceMessages",
                        x => new
                        {
                            x.TraceId,
                            x.TraceMessageType,
                            x.Index,
                        }
                    );
                    table.ForeignKey(
                        name: "FK_TraceMessages_Traces_TraceId",
                        column: x => x.TraceId,
                        principalTable: "Traces",
                        principalColumn: "TraceId",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_Traces_TraceCollectionId",
                table: "Traces",
                column: "TraceCollectionId"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "TraceAttributes");

            migrationBuilder.DropTable(name: "TraceMessages");

            migrationBuilder.DropTable(name: "Traces");

            migrationBuilder.DropTable(name: "TraceCollections");
        }
    }
}
