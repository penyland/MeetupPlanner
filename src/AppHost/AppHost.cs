using Aspire.Hosting.Yarp.Transforms;

var builder = DistributedApplication.CreateBuilder(args);

var db = builder.AddConnectionString("MeetupPlanner");

var api = builder.AddProject<Projects.MeetupPlanner_Api>("meetupplanner-api" )
    .WaitFor(db)
    .WithReference(db);

var adminApp = builder.AddProject<Projects.MeetupPlanner_Admin>("meetupplanner-admin")
    .WithReference(api);

var web = builder.AddViteApp("web", "../Web")
    .WaitFor(api)
    .WithReference(api);

builder.AddMcpInspector("mcp-inspector")
    .WaitFor(api)
    .WithMcpServer(api, path: "/mcp");

var reverse_proxy = builder.AddYarp("reverse-proxy")
    .WithConfiguration(config =>
    {
        config.AddRoute("/api/{**catch-all}", api)
            .WithTransformPathRemovePrefix("/api");

        config.AddRoute("/admin/{**catch-all}", adminApp)
            .WithTransformPathRemovePrefix("/admin")
            .WithTransformForwarded()
            .WithTransformUseOriginalHostHeader()
            .WithTransformRequestHeader("X-Forwarded-Prefix", "/admin")
            .WithTransformXForwarded(xPrefix: Yarp.ReverseProxy.Transforms.ForwardedTransformActions.Append);

        config.AddRoute("/web/{**catch-all}", web)
            .WithTransformPathRemovePrefix("/web");
    })
    .WithExternalHttpEndpoints()
    .PublishWithStaticFiles(web);


builder.Build().Run();
