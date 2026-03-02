var builder = DistributedApplication.CreateBuilder(args);

// Add a SQL Server container
var sqlServer = builder.AddSqlServer("sqlserver", port: 1433)
    .WithDataVolume("meetuppplanner")
    .WithImage("mssql/server", "latest")
    .WithLifetime(ContainerLifetime.Persistent);

var database = sqlServer.AddDatabase("db", "MeetupPlanner");

// Add a database connection string
var dbConnectionString = builder.AddConnectionString("MeetupPlanner");

// Keycloak
var keycloakdUsername = builder.AddParameter("username");
var keycloakPassword = builder.AddParameter("password", secret: true);
var openIDConnectSettingsClientSecret = builder.AddParameter("OpenIDConnectSettingsClientSecret", secret: true);

var keycloak = builder.AddKeycloak("keycloak", port:8080, adminUsername: keycloakdUsername, adminPassword: keycloakPassword)
    .WithDataVolume("meetupplanner-datavolume")
    .WithOtlpExporter()
    .WithLifetime(ContainerLifetime.Persistent)
    .WithRealmImport("../../config/keycloak");

keycloakdUsername.WithParentRelationship(keycloak);
keycloakPassword.WithParentRelationship(keycloak);

// Projects
var api = builder.AddProject<Projects.MeetupPlanner_Api>("api")
    .WaitFor(dbConnectionString)
    .WithReference(dbConnectionString)
    .WithReference(keycloak)
    .WithReference(database)
    .WaitFor(database)
    .WithEnvironment(async context =>
    {
        context.EnvironmentVariables["MeetupPlanner:ConnectionString"] = await database.Resource.ConnectionStringExpression.GetValueAsync(CancellationToken.None) ?? string.Empty;
    });

var web = builder.AddViteApp("web", "../Web")
    .WaitFor(api)
    .WithReference(api);

var adminWeb = builder.AddViteApp("admin-frontend", "../MeetupPlanner.AdminReact")
    .WithReference(api);

var bff = builder.AddProject<Projects.MeetupPlanner_Bff>("bff")
    .WithReference(api)
    .WithReference(keycloak).WaitFor(keycloak)
    .WithReference(adminWeb)
    .WithEnvironment("OpenIDConnectSettings__ClientSecret", openIDConnectSettingsClientSecret)
    .WithExternalHttpEndpoints();

adminWeb.WithReference(bff);

builder.Build().Run();






//.WithEnvironment("Authentication__KeyCloak__Authority", () => keycloak.GetEndpoint("http")!.Url.TrimEnd('/') + "/realms/meetupplanner")
//.WithEnvironment("Authentication__KeyCloak__RevocationEndpoint", () => keycloak.GetEndpoint("http")!.Url.TrimEnd('/') + "/realms/meetupplanner/protocol/openid-connect/revoke")
//.WithEnvironment("Frontend__DevServer", () => adminWeb.GetEndpoint("http")!.Url)
//api.WithEnvironment("Cors__AllowedOrigins", () => bff.GetEndpoint("http")!.Url.TrimEnd('/'));
//api.WithEnvironment("KeyCloak__Authority", () => keycloak.GetEndpoint("http")!.Url.TrimEnd('/') + "/realms/meetupplanner");
//api.WithEnvironment("KeyCloak__ClientId", "admin-bff");
//api.WithEnvironment("KeyCloak__RequireHttpsMetadata", "false");

//builder.AddMcpInspector("mcp-inspector")
//    .WaitFor(api)
//    .WithMcpServer(api, path: "/mcp");

//var reverse_proxy = builder.AddYarp("reverse-proxy")
//    .WithConfiguration(config =>
//    {
//        config.AddRoute("/api/{**catch-all}", api)
//            .WithTransformPathRemovePrefix("/api");

//        config.AddRoute("/admin/{**catch-all}", bff)
//            .WithTransformPathRemovePrefix("/admin")
//            .WithTransformForwarded()
//            .WithTransformUseOriginalHostHeader()
//            .WithTransformRequestHeader("X-Forwarded-Prefix", "/admin")
//            .WithTransformXForwarded(xPrefix: Yarp.ReverseProxy.Transforms.ForwardedTransformActions.Append);

//        config.AddRoute("/web/{**catch-all}", web)
//            .WithTransformPathRemovePrefix("/web");
//    })
//    .WithExternalHttpEndpoints()
//    .PublishWithStaticFiles(web);
