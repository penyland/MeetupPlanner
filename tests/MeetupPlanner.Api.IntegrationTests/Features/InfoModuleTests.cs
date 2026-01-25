using Shouldly;
using static MeetupPlanner.Api.Features.Info.InfoEndpoints;

namespace MeetupPlanner.Api.IntegrationTests.Features;

public class InfoModuleTests : IntegrationTestsBase
{
    [Test]
    public async Task GetVersion_ReturnsSuccessStatusCode()
    {
        // Arrange
        var client = Factory.CreateClient();
        // Act
        var response = await client.GetAsync("/info/version", CancellationToken.None);
        // Assert
        response.EnsureSuccessStatusCode();
    }

    [Test]
    public async Task GetVersion_ReturnsExpectedMediaType()
    {
        // Arrange
        var client = Factory.CreateClient();
        // Act
        var response = await client.GetAsync("/info/version", CancellationToken.None);
        // Assert
        response.Content.Headers.ContentType?.MediaType.ShouldBe("application/json");
    }

    [Test]
    public async Task GetInfo_ReturnsExpectedResponse()
    {
        // Arrange
        var client = Factory.CreateClient();

        // Act
        var response = await client.GetFromJsonAsync<Info>("/info/version", CancellationToken.None);

        // Assert
        response.ShouldNotBeNull();
    }
}
