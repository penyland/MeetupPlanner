using TUnit.AspNetCore;

namespace MeetupPlanner.Api.IntegrationTests;

public class WebApplicationFactory : TestWebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Configure shared services and settings
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                // Add any necessary configuration overrides for testing here
                { "Key", "Value" },
            });
        })
        .ConfigureServices(services =>
        {
            // Add any necessary test services here
        })
        .UseEnvironment("IntegrationTest");
    }
}

public abstract class IntegrationTestsBase : WebApplicationTest<WebApplicationFactory, Program>
{
}

public static class ServiceCollectionExtensions
{
    extension(IServiceCollection services)
    {
        public void RemoveServiceDescriptor<T>() where T : class
        {
            var descriptor = services.SingleOrDefault(sd => sd.ServiceType == typeof(T));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }
        }
    }
}
