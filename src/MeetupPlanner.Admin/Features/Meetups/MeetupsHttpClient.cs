using MeetupPlanner.Shared;
using System.Text.Json;

namespace MeetupPlanner.Admin.Features.Meetups;

public static class MeetupHttpClientExtensions
{
    public static IServiceCollection AddMeetupsHttpClient(this IServiceCollection services)
    {
        services.AddHttpClient<MeetupsHttpClient>(client =>
        {
            client.BaseAddress = new Uri("https+http://meetupplanner-api");
        });
        return services;
    }
}


public class MeetupsHttpClient(HttpClient httpClient)
{
    public async Task<MeetupResponse[]> GetAllMeetupsAsync(CancellationToken cancellationToken = default)
    {
        var response = await httpClient.GetFromJsonAsync<MeetupResponse[]>("meetupplanner/meetups", cancellationToken);
        return response ?? [];
    }

    public async Task<MeetupResponse[]> GetScheduledMeetupsAsync(CancellationToken cancellationToken = default)
    {
        var response = await httpClient.GetFromJsonAsync<MeetupResponse[]>("meetupplanner/meetups?status=scheduled", cancellationToken);
        return response ?? [];
    }

    public async Task<MeetupResponse?> GetMeetupByIdAsync(Guid meetupId, CancellationToken cancellationToken = default)
    {
        var response = await httpClient.GetFromJsonAsync<MeetupResponse>($"meetupplanner/meetups/{meetupId}", cancellationToken);
        return response;
    }

    public async Task<List<RsvpResponse>> GetRsvpsAsync(CancellationToken cancellationToken = default)
    {
        var response = await httpClient.GetFromJsonAsync<List<RsvpResponse>>("meetupplanner/meetups/rsvps", cancellationToken);
        return response ?? [];
    }
}
