var builder = DistributedApplication.CreateBuilder(args);

// Add a database connection string
var db = builder.AddConnectionString("MeetupPlanner");

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
    .WaitFor(db)
    .WithReference(db)
    .WithReference(keycloak);

var adminApp = builder.AddProject<Projects.MeetupPlanner_Admin>("meetupplanner-admin")
    .WithReference(api);

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
    //.WithEnvironment("Authentication__KeyCloak__Authority", () => keycloak.GetEndpoint("http")!.Url.TrimEnd('/') + "/realms/meetupplanner")
    //.WithEnvironment("Authentication__KeyCloak__RevocationEndpoint", () => keycloak.GetEndpoint("http")!.Url.TrimEnd('/') + "/realms/meetupplanner/protocol/openid-connect/revoke")
    //.WithEnvironment("Frontend__DevServer", () => adminWeb.GetEndpoint("http")!.Url)
    .WithExternalHttpEndpoints();

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


builder.Build().Run();
