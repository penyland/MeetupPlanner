using Aspire.Hosting.Yarp.Transforms;

var builder = DistributedApplication.CreateBuilder(args);

var db = builder.AddConnectionString("MeetupPlanner");

var api = builder.AddProject<Projects.MeetupPlanner_Api>("meetupplanner-api" )
    .WaitFor(db)
    .WithReference(db);

var adminApp = builder.AddProject<Projects.MeetupPlanner_Admin>("meetupplanner-admin");

var web = builder.AddViteApp("web", "../Web")
    .WaitFor(api)
    .WithReference(api);

var proxy = builder.AddProject<Projects.MeetupPlanner_Proxy>("meetupplanner-proxy")
    .WaitFor(api)
    .WithReference(api)
    .WithExternalHttpEndpoints();

builder.AddMcpInspector("mcp-inspector")
    .WaitFor(api)
    .WithMcpServer(api, path: "/mcp");

var reverse_proxy = builder.AddYarp("reverse-proxy")
    .WithConfiguration(config =>
    {
        config.AddRoute("/api/{**catch-all}", api)
            .WithTransformPathRemovePrefix("/api");

        config.AddRoute("/admin/{**catch-all}", adminApp)
            .WithTransformPathRemovePrefix("/admin");

        config.AddRoute("/{**catch-all}", web);
    })
    .WithExternalHttpEndpoints()
    .PublishWithStaticFiles(web);


builder.Build().Run();
