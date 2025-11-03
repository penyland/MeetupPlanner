namespace MeetupPlanner.Api.Features.Mcp;

public class McpModule : WebFeatureModule
{
    public override IModuleInfo ModuleInfo { get; } = new FeatureModuleInfo(typeof(McpModule).FullName, typeof(McpModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.Services.AddMcpServer()
            .WithHttpTransport(o => o.Stateless = true);
    }

    public override void MapEndpoints(WebApplication app)
    {
        // Mapping MCP endpoints here because mapping in the feature modules causes Ambiguous routes exception.
        app.MapMcp("/mcp");//.RequireAuthorization();
    }
}
