using Infinity.Toolkit.FeatureModules;
using MeetupPlanner.Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

namespace MeetupPlanner;

public class MeetupPlannerModule : WebFeatureModule
{
    public override IModuleInfo? ModuleInfo { get; } = new FeatureModuleInfo(nameof(MeetupPlannerModule), typeof(MeetupPlannerModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.AddSqlServerDbContext<MeetupPlannerDbContext>("MeetupPlanner");
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/meetupplanner")
            .WithTags("Meetup Planner");

        // Mapping MCP endpoints here because mapping in the feature modules causes Ambigous routes exception.
        group.MapMcp("/mcp");//.RequireAuthorization();
    }
}
