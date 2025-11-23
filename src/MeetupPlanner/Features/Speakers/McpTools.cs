using MeetupPlanner.Infrastructure;
using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;
using System.ComponentModel;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MeetupPlanner.Features.Speakers;

[McpServerToolType]
public class McpTools(MeetupPlannerDbContext meetupPlannerDbContext)
{
    private readonly MeetupPlannerDbContext meetupPlannerDbContext = meetupPlannerDbContext;

    [McpServerTool, Description("Get a list of speakers that have had a presentation at any meetup event.")]
    public async Task<string> GetSpeakersAsync()
    {
        var speakers = await meetupPlannerDbContext.Speakers
            .AsNoTracking()
            .Select(s => new SpeakerResponse
            {
                SpeakerId = s.SpeakerId,
                FullName = s.FullName,
                ThumbnailUrl = s.ThumbnailUrl,
            })
            .ToListAsync();

        return JsonSerializer.Serialize(speakers, MeetupPlannerSerializationContext.Default.ListSpeakerResponse);
    }

    [McpServerTool, Description("Get detailed information about a speaker by name.")]
    public async Task<string> GetSpeakerByNameAsync([Description("The name of the speaker to get details for.")] string name)
    {
        var speaker = await meetupPlannerDbContext.Speakers
            .AsNoTracking()
            .Where(s => s.FullName == name)
            .Select(s => new SpeakerDetailedResponse
            {
                SpeakerId = s.SpeakerId,
                FullName = s.FullName,
                ThumbnailUrl = s.ThumbnailUrl,
                Company = s.Company,
                Email = s.Email,
                BlogUrl = s.BlogUrl,
                TwitterUrl = s.TwitterUrl,
                GitHubUrl = s.GitHubUrl,
                LinkedInUrl = s.LinkedInUrl,
                Bio = s.Bios.First(b => b.IsPrimary).Bio,
            })
            .SingleOrDefaultAsync();

        return JsonSerializer.Serialize(speaker, MeetupPlannerSerializationContext.Default.SpeakerDetailedResponse);
    }
}

[JsonSerializable(typeof(List<SpeakerResponse>))]
[JsonSerializable(typeof(SpeakerDetailedResponse))]
[JsonSourceGenerationOptions(
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
internal sealed partial class MeetupPlannerSerializationContext : JsonSerializerContext;
