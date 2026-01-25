using Infinity.Toolkit.FeatureModules;

namespace MeetupPlanner.Bff.Features.Speakers;

internal class SpeakersModule : WebFeatureModule
{
    public override IModuleInfo ModuleInfo { get; } = new FeatureModuleInfo(typeof(SpeakersModule).FullName, typeof(SpeakersModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.Services.AddHttpClient<SpeakersHttpClient>(client =>
        {
            client.BaseAddress = new Uri("https+http://api/meetupplanner/speakers");
        });
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/speakers").WithTags("Speakers");

        group.MapGet("", async (SpeakersHttpClient speakersHttpClient) =>
        {
            // Get speakers
            var speakers = await speakersHttpClient.GetAllSpeakersAsync();
            speakers = [.. speakers.OrderBy(s => s.FullName)];
            return TypedResults.Ok(speakers);
        });
    }
}

public class SpeakersHttpClient(HttpClient httpClient)
{
    public async Task<SpeakerResponse[]> GetAllSpeakersAsync(CancellationToken cancellationToken = default)
    {
        var response = await httpClient.GetFromJsonAsync<SpeakerResponse[]>("", cancellationToken);
        return response ?? [];
    }
}

public record SpeakerResponse(
    Guid SpeakerId,
    string FullName,
    string ThumbnailUrl
);
