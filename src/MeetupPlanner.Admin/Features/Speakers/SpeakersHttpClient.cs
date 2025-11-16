namespace MeetupPlanner.Admin.Features.Speakers;

public static class SpeakersHttpClientExtensions
{
    public static IServiceCollection AddSpeakersHttpClient(this IServiceCollection services)
    {
        services.AddHttpClient<SpeakersHttpClient>(client =>
        {
            client.BaseAddress = new Uri("https+http://meetupplanner-api");
        });
        return services;
    }
}

public class SpeakersHttpClient(HttpClient httpClient)
{
    public async Task<SpeakerResponse[]> GetAllSpeakersAsync(CancellationToken cancellationToken = default)
    {
        var response = await httpClient.GetFromJsonAsync<SpeakerResponse[]>("meetupplanner/speakers", cancellationToken);
        return response ?? [];
    }

    public async Task<Guid> AddSpeakerAsync(SpeakerRequest speaker, CancellationToken cancellationToken = default)
    {
        var response = await httpClient.PostAsJsonAsync("meetupplanner/speakers", speaker, cancellationToken);
        response.EnsureSuccessStatusCode();
        var speakerId = await response.Content.ReadFromJsonAsync<AddSpeakerResponse>(cancellationToken: cancellationToken);
        return speakerId!.SpeakerId;
    }
}

public record SpeakerResponse(Guid SpeakerId,
    string Name,
    string Company,
    string Email,
    string TwitterUrl,
    string GitHubUrl,
    string LinkedInUrl,
    string BlogUrl,
    string ThumbnailUrl,
    string Bio
);

public record SpeakerRequest
{
    public string FullName { get; set; }
    public string? Company { get; set; }
    public string? Email { get; set; }
    public string? TwitterUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? BlogUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? Bio { get; set; }
    public bool IsPrimaryBiography { get; set; } = false;
}

public record SpeakerBiographiesResponse
{
    public Guid SpeakerBiographyId { get; init; }
    public string Biography { get; init; } = string.Empty;
    public bool IsPrimary { get; init; }
}

public record AddSpeakerResponse(Guid SpeakerId);
