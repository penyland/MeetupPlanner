using Infinity.Toolkit.Azure;
using MeetupPlanner.Api.ExceptionHandlers;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.ConfigureAzureAppConfiguration();
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddUserSecrets<Program>();
}

// Add services to the container.
builder.AddFeatureModules();
builder.Services.AddHttpContextAccessor();
//builder.Services.AddMicrosoftIdentityWebApiAuthentication(builder.Configuration, "AzureAd");
builder.Services.AddAuthentication()
        .AddKeycloakJwtBearer("keycloak", realm: "meetupplanner", options =>
        {
            options.Authority = "https+http://keycloak/realms/meetupplanner";
            options.Audience = "meetupplanner-api";
            options.RequireHttpsMetadata = false;

            options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
            {
                ValidIssuers =
                [
                    "http://keycloak/realms/meetupplanner",
                    "https://keycloak/realms/meetupplanner"
                ]
            };
        });

//.AddJwtBearer(options =>
//{
//    options.Authority = "https://keycloak-apphost.dev.localhost:49190/realms/meetupplanner";
//    options.Audience = "meetupplanner-api";
//    options.RequireHttpsMetadata = false;
//});

builder.Services.AddAuthorizationBuilder();

builder.Services.AddProblemDetails(options =>
    options.CustomizeProblemDetails = ctx =>
    {
        ctx.ProblemDetails.Instance = $"{ctx.HttpContext.Request.Method} {ctx.HttpContext.Request.Path}";
        ctx.ProblemDetails.Extensions.TryAdd("requestId", ctx.HttpContext.TraceIdentifier);
    });

builder.Services.AddExceptionHandler<ExceptionToProblemDetailsHandler>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder => builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    options.SerializerOptions.Converters.Add(new MeetupPlanner.Shared.UtcDateTimeOffsetConverter());
});

var app = builder.Build();

app.UseStatusCodePages();
app.UseExceptionHandler(new ExceptionHandlerOptions
{
    StatusCodeSelector = ex => ex switch
    {
        InvalidOperationException _ => StatusCodes.Status400BadRequest,
        _ => StatusCodes.Status500InternalServerError,
    },
});

app.UseCors("AllowAll");

app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
//app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapFeatureModules();

app.Run();
