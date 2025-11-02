using MeetupPlanner.AppHost;

var builder = DistributedApplication.CreateBuilder(args);

var db = builder.AddConnectionString("MeetupPlanner");

var api = builder.AddProject<Projects.MeetupPlanner_Api>("MeetupPlannerApi" )
    .WaitFor(db)
    .WithReference(db);

var web = builder.AddViteApp("web", "../Web")
    .WaitFor(api)
    .WithReference(api)
    .WithExternalHttpEndpoints()
    //.WithEnvironment("VITE_API_URL", api.GetEndpoint("https"))
    .WithNpmPackageInstallation();

var proxy = builder.AddProject<Projects.MeetupPlanner_Proxy>("meetupplanner-proxy")
    .WaitFor(api)
    .WithReference(api)
    .WithExternalHttpEndpoints();

builder.AddMcpInspector("mcp-inspector")
    .WaitFor(api)
    .WithMcpServer(api, path: "/mcp");

builder.Build().Run();
