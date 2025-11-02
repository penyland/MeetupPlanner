using Infinity.Toolkit;
using Infinity.Toolkit.AspNetCore;
using Infinity.Toolkit.FeatureModules;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Features.Common;
using MeetupPlanner.Features.Meetups;
using MeetupPlanner.Features.Presentations;
using MeetupPlanner.Features.Speakers;
using MeetupPlanner.Infrastructure;
using MeetupPlanner.MCP;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace MeetupPlanner;

public class MeetupPlannerModule : WebFeatureModule
{
    public override IModuleInfo? ModuleInfo { get; } = new FeatureModuleInfo(nameof(MeetupPlannerModule), typeof(MeetupPlannerModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.AddSqlServerDbContext<MeetupPlannerDbContext>("MeetupPlanner");

        builder.Services.AddMcpServer()
            .WithHttpTransport(o => o.Stateless = true)
            .WithTools<MeetupPlannerMcpTools>();
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/meetupplanner")
            .WithTags("Meetup Planner");

        group.MapMcp("/mcp").RequireAuthorization();
    }
}
