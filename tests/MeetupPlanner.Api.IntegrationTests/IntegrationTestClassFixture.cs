using Microsoft.AspNetCore.Mvc.Testing;

namespace MeetupPlanner.Api.IntegrationTests;

public class IntegrationTestClassFixture : WebApplicationFactory<Program>
{
    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.UseEnvironment("IntegrationTest");
        return base.CreateHost(builder);
    }
}
