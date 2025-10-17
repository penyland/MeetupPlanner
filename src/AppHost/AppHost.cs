using MeetupPlanner.AppHost;

var builder = DistributedApplication.CreateBuilder(args);

var db = builder.AddConnectionString("MeetupPlanner");

var api = builder.AddProject<Projects.MeetupPlanner_Api>("MeetupPlannerApi" )
    .WaitFor(db)
    .WithReference(db)
    .WithScalarCommand();

var web = builder.AddViteApp("web", "../Web")
    .WaitFor(api)
    .WithReference(api)
    .WithExternalHttpEndpoints()
    .WithEnvironment("VITE_API_URL", api.GetEndpoint("http"));

var proxy = builder.AddProject<Projects.MeetupPlanner_Proxy>("meetupplanner-proxy")
    .WaitFor(api)
    .WithReference(api)
    .WithExternalHttpEndpoints();

builder.AddMcpInspector("mcp-inspector",
    options =>
    {
        options.InspectorVersion = "0.17.1";
    })
    .WaitFor(api)
    .WithMcpServer(api, path: "/meetupplanner/mcp");

builder.Build().Run();
