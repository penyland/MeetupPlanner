using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetupPlanner.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    LocationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Street = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PostalCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Country = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MaxCapacity = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.LocationId);
                });

            migrationBuilder.CreateTable(
                name: "Presentations",
                columns: table => new
                {
                    PresentationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Abstract = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DurationMinutes = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RepoUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SlidesUrl = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Presentations", x => x.PresentationId);
                });

            migrationBuilder.CreateTable(
                name: "Speakers",
                columns: table => new
                {
                    SpeakerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Company = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LinkedInUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TwitterUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GitHubUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BlogUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ThumbnailUrl = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Speakers", x => x.SpeakerId);
                });

            migrationBuilder.CreateTable(
                name: "Meetups",
                columns: table => new
                {
                    MeetupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    EndUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    LocationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TotalSpots = table.Column<int>(type: "int", nullable: true),
                    RsvpYesCount = table.Column<int>(type: "int", nullable: true),
                    RsvpNoCount = table.Column<int>(type: "int", nullable: true),
                    RsvpWaitlistCount = table.Column<int>(type: "int", nullable: true),
                    AttendanceCount = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Meetups", x => x.MeetupId);
                    table.ForeignKey(
                        name: "FK_Meetups_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "LocationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PresentationSpeakers",
                columns: table => new
                {
                    PresentationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SpeakerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PresentationSpeakers", x => new { x.PresentationId, x.SpeakerId });
                    table.ForeignKey(
                        name: "FK_PresentationSpeakers_Presentations_PresentationId",
                        column: x => x.PresentationId,
                        principalTable: "Presentations",
                        principalColumn: "PresentationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PresentationSpeakers_Speakers_SpeakerId",
                        column: x => x.SpeakerId,
                        principalTable: "Speakers",
                        principalColumn: "SpeakerId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SpeakerBios",
                columns: table => new
                {
                    SpeakerBioId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SpeakerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Bio = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpeakerBios", x => x.SpeakerBioId);
                    table.ForeignKey(
                        name: "FK_SpeakerBios_Speakers_SpeakerId",
                        column: x => x.SpeakerId,
                        principalTable: "Speakers",
                        principalColumn: "SpeakerId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MeetupSpeakers",
                columns: table => new
                {
                    MeetupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SpeakerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeetupSpeakers", x => new { x.MeetupId, x.SpeakerId });
                    table.ForeignKey(
                        name: "FK_MeetupSpeakers_Meetups_MeetupId",
                        column: x => x.MeetupId,
                        principalTable: "Meetups",
                        principalColumn: "MeetupId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MeetupSpeakers_Speakers_SpeakerId",
                        column: x => x.SpeakerId,
                        principalTable: "Speakers",
                        principalColumn: "SpeakerId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScheduleSlots",
                columns: table => new
                {
                    SlotId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MeetupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    StartUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    EndUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    PresentationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduleSlots", x => x.SlotId);
                    table.ForeignKey(
                        name: "FK_ScheduleSlots_Meetups_MeetupId",
                        column: x => x.MeetupId,
                        principalTable: "Meetups",
                        principalColumn: "MeetupId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ScheduleSlots_Presentations_PresentationId",
                        column: x => x.PresentationId,
                        principalTable: "Presentations",
                        principalColumn: "PresentationId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Meetups_LocationId",
                table: "Meetups",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_MeetupSpeakers_SpeakerId",
                table: "MeetupSpeakers",
                column: "SpeakerId");

            migrationBuilder.CreateIndex(
                name: "IX_PresentationSpeakers_PresentationId",
                table: "PresentationSpeakers",
                column: "PresentationId",
                unique: true,
                filter: "[IsPrimary] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_PresentationSpeakers_SpeakerId",
                table: "PresentationSpeakers",
                column: "SpeakerId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduleSlots_MeetupId_SortOrder",
                table: "ScheduleSlots",
                columns: new[] { "MeetupId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScheduleSlots_PresentationId",
                table: "ScheduleSlots",
                column: "PresentationId");

            migrationBuilder.CreateIndex(
                name: "IX_SpeakerBios_SpeakerId",
                table: "SpeakerBios",
                column: "SpeakerId",
                unique: true,
                filter: "[IsPrimary] = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MeetupSpeakers");

            migrationBuilder.DropTable(
                name: "PresentationSpeakers");

            migrationBuilder.DropTable(
                name: "ScheduleSlots");

            migrationBuilder.DropTable(
                name: "SpeakerBios");

            migrationBuilder.DropTable(
                name: "Meetups");

            migrationBuilder.DropTable(
                name: "Presentations");

            migrationBuilder.DropTable(
                name: "Speakers");

            migrationBuilder.DropTable(
                name: "Locations");
        }
    }
}
