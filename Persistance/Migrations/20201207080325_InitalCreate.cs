using Microsoft.EntityFrameworkCore.Migrations;

namespace Persistence.Migrations
{
    public partial class InitalCreate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Servers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServerName = table.Column<string>(type: "TEXT", nullable: true),
                    ServerType = table.Column<int>(type: "INTEGER", nullable: false),
                    MinecraftVersion = table.Column<string>(type: "TEXT", nullable: true),
                    Port = table.Column<int>(type: "INTEGER", nullable: false),
                    MinRam = table.Column<string>(type: "TEXT", nullable: true),
                    MaxRam = table.Column<string>(type: "TEXT", nullable: true),
                    WorkingFolder = table.Column<string>(type: "TEXT", nullable: true),
                    JarFile = table.Column<string>(type: "TEXT", nullable: true),
                    IsEulaTrue = table.Column<bool>(type: "INTEGER", nullable: false),
                    SecondaryVersionNumber = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Servers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ServerProperty",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Key = table.Column<string>(type: "TEXT", nullable: true),
                    Value = table.Column<string>(type: "TEXT", nullable: true),
                    IsBoolean = table.Column<bool>(type: "INTEGER", nullable: false),
                    ServerId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServerProperty", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServerProperty_Servers_ServerId",
                        column: x => x.ServerId,
                        principalTable: "Servers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServerProperty_ServerId",
                table: "ServerProperty",
                column: "ServerId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServerProperty");

            migrationBuilder.DropTable(
                name: "Servers");
        }
    }
}
