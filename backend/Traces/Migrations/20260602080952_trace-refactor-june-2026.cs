using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Traces.Migrations
{
    /// <inheritdoc />
    public partial class tracerefactorjune2026 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TraceAttributes");

            migrationBuilder.DropTable(
                name: "TraceMessages");

            migrationBuilder.AddColumn<Guid>(
                name: "TraceGroupId",
                table: "Traces",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TraceGroupId1",
                table: "Traces",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TraceGroups",
                columns: table => new
                {
                    TraceGroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    TraceGroupType = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TraceGroups", x => x.TraceGroupId);
                });

            migrationBuilder.CreateTable(
                name: "TraceResources",
                columns: table => new
                {
                    TraceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Value = table.Column<string>(type: "character varying(32768)", maxLength: 32768, nullable: false),
                    TraceAttributeType = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TraceResources", x => new { x.TraceId, x.Key });
                    table.ForeignKey(
                        name: "FK_TraceResources_Traces_TraceId",
                        column: x => x.TraceId,
                        principalTable: "Traces",
                        principalColumn: "TraceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TraceScopes",
                columns: table => new
                {
                    TraceScopeId = table.Column<Guid>(type: "uuid", nullable: false),
                    TraceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Version = table.Column<string>(type: "character varying(2560)", maxLength: 2560, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TraceScopes", x => x.TraceScopeId);
                    table.ForeignKey(
                        name: "FK_TraceScopes_Traces_TraceId",
                        column: x => x.TraceId,
                        principalTable: "Traces",
                        principalColumn: "TraceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TraceScopeSpans",
                columns: table => new
                {
                    TraceScopeSpanId = table.Column<Guid>(type: "uuid", nullable: false),
                    TraceScopeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentSpanId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    StartTimeUnixNano = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                    EndTimeUnixNano = table.Column<decimal>(type: "numeric(20,0)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TraceScopeSpans", x => x.TraceScopeSpanId);
                    table.ForeignKey(
                        name: "FK_TraceScopeSpans_TraceScopes_TraceScopeId",
                        column: x => x.TraceScopeId,
                        principalTable: "TraceScopes",
                        principalColumn: "TraceScopeId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SpanAttributes",
                columns: table => new
                {
                    SpanId = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Value = table.Column<string>(type: "character varying(2560)", maxLength: 2560, nullable: false),
                    TraceAttributeType = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpanAttributes", x => new { x.SpanId, x.Key });
                    table.ForeignKey(
                        name: "FK_SpanAttributes_TraceScopeSpans_SpanId",
                        column: x => x.SpanId,
                        principalTable: "TraceScopeSpans",
                        principalColumn: "TraceScopeSpanId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SpanEvent",
                columns: table => new
                {
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    SpanId = table.Column<Guid>(type: "uuid", nullable: false),
                    TimeUnixNano = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpanEvent", x => x.EventId);
                    table.ForeignKey(
                        name: "FK_SpanEvent_TraceScopeSpans_SpanId",
                        column: x => x.SpanId,
                        principalTable: "TraceScopeSpans",
                        principalColumn: "TraceScopeSpanId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SpanEventAttributes",
                columns: table => new
                {
                    SpanEventId = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Value = table.Column<string>(type: "character varying(2560)", maxLength: 2560, nullable: false),
                    TraceAttributeType = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpanEventAttributes", x => new { x.SpanEventId, x.Key });
                    table.ForeignKey(
                        name: "FK_SpanEventAttributes_SpanEvent_SpanEventId",
                        column: x => x.SpanEventId,
                        principalTable: "SpanEvent",
                        principalColumn: "EventId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Traces_TraceGroupId",
                table: "Traces",
                column: "TraceGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Traces_TraceGroupId1",
                table: "Traces",
                column: "TraceGroupId1");

            migrationBuilder.CreateIndex(
                name: "IX_SpanEvent_SpanId",
                table: "SpanEvent",
                column: "SpanId");

            migrationBuilder.CreateIndex(
                name: "IX_TraceScopes_TraceId",
                table: "TraceScopes",
                column: "TraceId");

            migrationBuilder.CreateIndex(
                name: "IX_TraceScopeSpans_TraceScopeId",
                table: "TraceScopeSpans",
                column: "TraceScopeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Traces_TraceGroups_TraceGroupId",
                table: "Traces",
                column: "TraceGroupId",
                principalTable: "TraceGroups",
                principalColumn: "TraceGroupId");

            migrationBuilder.AddForeignKey(
                name: "FK_Traces_TraceGroups_TraceGroupId1",
                table: "Traces",
                column: "TraceGroupId1",
                principalTable: "TraceGroups",
                principalColumn: "TraceGroupId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Traces_TraceGroups_TraceGroupId",
                table: "Traces");

            migrationBuilder.DropForeignKey(
                name: "FK_Traces_TraceGroups_TraceGroupId1",
                table: "Traces");

            migrationBuilder.DropTable(
                name: "SpanAttributes");

            migrationBuilder.DropTable(
                name: "SpanEventAttributes");

            migrationBuilder.DropTable(
                name: "TraceGroups");

            migrationBuilder.DropTable(
                name: "TraceResources");

            migrationBuilder.DropTable(
                name: "SpanEvent");

            migrationBuilder.DropTable(
                name: "TraceScopeSpans");

            migrationBuilder.DropTable(
                name: "TraceScopes");

            migrationBuilder.DropIndex(
                name: "IX_Traces_TraceGroupId",
                table: "Traces");

            migrationBuilder.DropIndex(
                name: "IX_Traces_TraceGroupId1",
                table: "Traces");

            migrationBuilder.DropColumn(
                name: "TraceGroupId",
                table: "Traces");

            migrationBuilder.DropColumn(
                name: "TraceGroupId1",
                table: "Traces");

            migrationBuilder.CreateTable(
                name: "TraceAttributes",
                columns: table => new
                {
                    TraceId = table.Column<Guid>(type: "uuid", nullable: false),
                    TraceAttributeType = table.Column<int>(type: "integer", nullable: false),
                    Key = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TraceAttributes", x => new { x.TraceId, x.TraceAttributeType, x.Key });
                    table.ForeignKey(
                        name: "FK_TraceAttributes_Traces_TraceId",
                        column: x => x.TraceId,
                        principalTable: "Traces",
                        principalColumn: "TraceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TraceMessages",
                columns: table => new
                {
                    TraceId = table.Column<Guid>(type: "uuid", nullable: false),
                    TraceMessageType = table.Column<int>(type: "integer", nullable: false),
                    Index = table.Column<int>(type: "integer", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TraceMessages", x => new { x.TraceId, x.TraceMessageType, x.Index });
                    table.ForeignKey(
                        name: "FK_TraceMessages_Traces_TraceId",
                        column: x => x.TraceId,
                        principalTable: "Traces",
                        principalColumn: "TraceId",
                        onDelete: ReferentialAction.Cascade);
                });
        }
    }
}
