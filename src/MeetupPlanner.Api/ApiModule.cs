namespace MeetupPlanner.Api;

public class ApiModule : WebFeatureModule
{
    public override IModuleInfo? ModuleInfo { get; } = new FeatureModuleInfo(nameof(ApiModule), typeof(ApiModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder) { }
}
