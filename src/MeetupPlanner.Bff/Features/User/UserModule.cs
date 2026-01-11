using Infinity.Toolkit.FeatureModules;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;

namespace MeetupPlanner.Bff.Features.User;

public class UserModule : WebFeatureModule
{
    public override IModuleInfo ModuleInfo { get; }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/bff")
            .WithTags("BFF");

        group.MapGet("user", (HttpContext context) =>
        {
            if (!context.User.Identity?.IsAuthenticated ?? true)
            {
                return Results.Unauthorized();
            }

            var roles = context.User.Claims
                .Where(c => c.Type is "roles" or "role")
                .Select(c => c.Value)
                .Distinct()
                .ToArray();

            return Results.Json(new
            {
                Name = context.User.FindFirstValue("name"),
                roles,
                Claims = context.User.Claims
                    .Select(c => new { c.Type, c.Value })
            });
        }).RequireAuthorization();

        group.MapGet("login", (HttpContext context, string? redirectUri) =>
        {
            var properties = new AuthenticationProperties
            {
                RedirectUri = context.BuildRedirectUrl(redirectUri),
            };

            return TypedResults.Challenge(properties);
        });

        group.MapGet("/logout", async ([FromQuery] string? redirectUri, HttpContext context, IConfiguration configuration, IHttpClientFactory httpClientFactory) =>
        {
            //var provider = configuration.GetValue<string>("Authentication:Provider") ?? "EntraId";
            //if (provider.Equals("KeyCloak", StringComparison.OrdinalIgnoreCase))
            //{
            //    await RevokeRefreshTokenAsync(context, configuration, httpClientFactory);
            //}

            var properties = new AuthenticationProperties
            {
                RedirectUri = context.BuildRedirectUrl(redirectUri),
            };

            return TypedResults.SignOut(properties, [CookieAuthenticationDefaults.AuthenticationScheme, OpenIdConnectDefaults.AuthenticationScheme]);

            //await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            //await context.SignOutAsync(OpenIdConnectDefaults.AuthenticationScheme, new AuthenticationProperties
            //{
            //    RedirectUri = "/"
            //});

            //return Results.Ok();
        }).RequireAuthorization();

        group.MapGet("session", async (HttpContext context) =>
        {
            var authResult = await context.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            //var identity = new
            //{
            //    authenticationType = context.User.Identity?.AuthenticationType,
            //    isAuthenticated = context.User.Identity?.IsAuthenticated,
            //    name = context.User.FindFirstValue("name") ?? "Unknown",
            //    email = context.User.Claims.FirstOrDefault(c => c.Type == "email")?.Value
            //};

            return TypedResults.Json(new
            {
                IsAuthenticated = context.User.Identity?.IsAuthenticated ?? false,
                Name = context.User.Identity?.Name,
            });

        }).RequireAuthorization();
    }

    static async Task RevokeRefreshTokenAsync(HttpContext context, IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        var refreshToken = await context.GetTokenAsync("refresh_token");
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        var revocationEndpoint = configuration["Authentication:KeyCloak:RevocationEndpoint"];
        if (string.IsNullOrWhiteSpace(revocationEndpoint))
        {
            return;
        }

        var clientId = configuration["Authentication:KeyCloak:ClientId"];
        var clientSecret = configuration["Authentication:KeyCloak:ClientSecret"];

        using var client = httpClientFactory.CreateClient("token-client");
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["token"] = refreshToken,
            ["token_type_hint"] = "refresh_token",
            ["client_id"] = clientId ?? string.Empty,
        });

        if (!string.IsNullOrEmpty(clientSecret))
        {
            content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["token"] = refreshToken,
                ["token_type_hint"] = "refresh_token",
                ["client_id"] = clientId ?? string.Empty,
                ["client_secret"] = clientSecret
            });
        }

        try
        {
            await client.PostAsync(revocationEndpoint, content);
        }
        catch
        {
            // Best-effort revocation; ignore failures for now.
        }
    }
}
