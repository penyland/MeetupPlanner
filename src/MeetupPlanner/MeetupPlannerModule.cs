using Infinity.Toolkit.FeatureModules;
using MeetupPlanner.Infrastructure;
using Microsoft.Extensions.Hosting;

namespace MeetupPlanner;

public class MeetupPlannerModule : FeatureModule
{
    public override IModuleInfo ModuleInfo { get; } = new FeatureModuleInfo("MeetupPlanner.Features", typeof(MeetupPlannerModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.AddSqlServerDbContext<MeetupPlannerDbContext>("MeetupPlanner");
    }
}
