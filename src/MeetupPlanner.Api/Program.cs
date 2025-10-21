using Azure.Identity;
using Infinity.Toolkit;
using Infinity.Toolkit.Azure;
using Infinity.Toolkit.Azure.Identity;
using MeetupPlanner.Api.ExceptionHandlers;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.ConfigureAzureAppConfiguration(configure: config =>
{
    // Check if we are running on Azure
    if (EnvironmentHelper.IsRunningInAzureContainerApps)
    {
        config.TokenCredential = new ManagedIdentityCredential(ManagedIdentityId.FromUserAssignedClientId(Environment.GetEnvironmentVariable("AZURE_CLIENT_ID")));
    }
    else
    {
        config.TokenCredential = TokenCredentialHelper.GetTokenCredential();
    }
});

// Add services to the container.
builder.AddFeatureModules();
builder.Services.AddHttpContextAccessor();
builder.Services.AddMicrosoftIdentityWebApiAuthentication(builder.Configuration, "AzureAd");

builder.Services.AddAuthorization();

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
