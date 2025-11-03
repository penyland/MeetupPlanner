using MeetupPlanner.Features.Common;
using MeetupPlanner.Infrastructure;
using ModelContextProtocol.Server;
using System.ComponentModel;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MeetupPlanner.Features.Locations;

[McpServerToolType]
public class McpTools(MeetupPlannerDbContext meetupPlannerDbContext)
{
    private readonly MeetupPlannerDbContext meetupPlannerDbContext = meetupPlannerDbContext;

    [McpServerTool, Description("Get a list of locations/sponsors where meetups have been or will be")]
    public async Task<string> GetLocationsAsync()
    {
        var locations = await meetupPlannerDbContext.GetLocationsAsync();
        var serializedLocations = JsonSerializer.Serialize(locations);
        return serializedLocations;
    }

    [McpServerTool, Description("Get a list of locations/sponsors where meetups have been or will be in a given city")]
    public async Task<string> GetLocationsByCityAsync([Description("The name of the city")] string city)
    {
        var locations = await meetupPlannerDbContext.GetLocationsByCityAsync(city);
        return JsonSerializer.Serialize(locations, LocationsSerializationContext.Default.ListLocationDetailedResponse);
    }

    [McpServerTool, Description("Get a location's/sponsor's details by its name")]
    public async Task<string> GetLocationByNameAsync([Description("The name of the location/sponsor to get details for.")] string name)
    {
        var location = await meetupPlannerDbContext.GetLocationByNameAsync(name);
        return JsonSerializer.Serialize(location, LocationsSerializationContext.Default.ListLocationDetailedResponse);
    }
}

[JsonSerializable(typeof(List<LocationDetailedResponse>))]
[JsonSourceGenerationOptions(
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
internal sealed partial class LocationsSerializationContext : JsonSerializerContext;
