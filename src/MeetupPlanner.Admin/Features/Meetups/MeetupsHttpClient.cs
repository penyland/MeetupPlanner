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
}

public record MeetupResponse(Guid MeetupId,
    string Title,
    string Description,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc);
