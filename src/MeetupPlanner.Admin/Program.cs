using ApexCharts;
using MeetupPlanner.Admin.Components;
using MeetupPlanner.Admin.Features.Meetups;
using MeetupPlanner.Admin.Features.Speakers;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.FluentUI.AspNetCore.Components;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddApexCharts();

builder.Services.AddMeetupsHttpClient();
builder.Services.AddSpeakersHttpClient();

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddHttpClient();
builder.Services.AddFluentUIComponents();

var app = builder.Build();

app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}
app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();

app.UseAntiforgery();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

app.Use(async (context, next) =>
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();

    // Request method, scheme, and path
    logger.LogInformation("Request Method: {Method}", context.Request.Method);
    logger.LogInformation("Request Scheme: {Scheme}", context.Request.Scheme);
    logger.LogInformation("Request Path: {Path}", context.Request.Path);

    // Headers
    foreach (var header in context.Request.Headers)
    {
        logger.LogInformation("Header: {Key}: {Value}", header.Key, header.Value);
    }

    // Connection: RemoteIp
    logger.LogInformation("Request RemoteIp: {RemoteIpAddress}", context.Connection.RemoteIpAddress);

    await next();
});

app.Use((context, next) =>
{
    if (context.Request.Headers.TryGetValue("X-Forwarded-Prefix", out var pathBase))
    {
        context.Request.PathBase = pathBase.ToString();
    }

    return next();
});

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
