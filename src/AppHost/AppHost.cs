using MeetupPlanner.AppHost;

var builder = DistributedApplication.CreateBuilder(args);

var sqlDb = builder.AddConnectionString("MeetupPlanner");

var api = builder.AddProject<Projects.MeetupPlanner_Api>("meetupplanner-api")
    .WithReference(sqlDb)
    .WithScalarCommand();

var proxy = builder.AddProject<Projects.MeetupPlanner_Proxy>("meetupplanner-proxy")
    .WaitFor(api)
    .WithReference(api)
    .WithExternalHttpEndpoints();

builder.Build().Run();
