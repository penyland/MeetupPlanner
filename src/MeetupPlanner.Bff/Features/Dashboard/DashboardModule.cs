using Infinity.Toolkit.FeatureModules;

namespace MeetupPlanner.Bff.Features.Dashboard;

public class DashboardModule : WebFeatureModule
{
    public override IModuleInfo ModuleInfo { get; } = new FeatureModuleInfo("DashboardModule", "1.0.0");

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        base.RegisterModule(builder);
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/dashboard")
            .WithTags("Dashboard");

        group.MapGet("", () => 
        {
            // Implement dashboard data aggregation logic here

            // Meetups count
            // Upcoming events
            // Number of attendees
            // Number of speakers
            // Rsvps

            // Implement caching

            return Results.Ok(new { Message = "Dashboard data will be here." });
        });
    }
}
