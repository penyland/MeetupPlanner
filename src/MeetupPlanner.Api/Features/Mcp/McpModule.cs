

namespace MeetupPlanner.Api.Features.Mcp;

public class McpModule : WebFeatureModule
{
    public override IModuleInfo ModuleInfo { get; }

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.Services.AddMcpServer()
            .WithHttpTransport(o => o.Stateless = true);
    }

    public override void MapEndpoints(WebApplication app)
    {
        // Mapping MCP endpoints here because mapping in the feature modules causes Ambigous routes exception.
        app.MapMcp("/mcp");//.RequireAuthorization();
    }
}
