using Infinity.Toolkit.FeatureModules;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Yarp.ReverseProxy.Configuration;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.AddFeatureModules();

builder.Services.AddHttpContextAccessor();
//builder.Services.AddAntiforgery(options =>
//{
//    options.HeaderName = "X-CSRF";
//    options.Cookie.Name = "__Host-mp-bff-csrf";
//    options.Cookie.SameSite = SameSiteMode.Lax;
//    options.Cookie.HttpOnly = false;
//    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
//});

JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
    })
    .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
    {
        options.Cookie.Name = "__Host-AuthCookie";
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    })
    .AddKeycloakOpenIdConnect(
        serviceName: "keycloak",
        realm: "meetupplanner",
        options =>
        {
            options.ClientId = "meetupplanner-gateway";
            options.ClientSecret = "iy2HYOqLA5R5rAlTbJGUq2Qc7p4xJk1G";
            options.ResponseType = OpenIdConnectResponseType.Code;
            options.SaveTokens = true;
            options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            options.CallbackPath = "/signin-oidc";
            options.RequireHttpsMetadata = false;
            options.GetClaimsFromUserInfoEndpoint = true;
            options.MapInboundClaims = false;
            options.UsePkce = true;

            if (builder.Environment.IsDevelopment())
            {
                options.RequireHttpsMetadata = false;
            }

            options.TokenValidationParameters = new TokenValidationParameters
            {
                NameClaimType = "name",
                RoleClaimType = "roles",
                ValidateAudience = true,
            };

            options.Scope.Clear();
            options.Scope.Add("openid");
            //options.Scope.Add("profile");
            options.Scope.Add("email");
            options.Scope.Add("offline_access");
            //options.Scope.Add("meetupplanner-api.all");
        });
//.AddCookie(options =>
//{
//    options.LoginPath = "/bff/login";
//    options.LogoutPath = "/bff/logout";
//    options.ExpireTimeSpan = TimeSpan.FromHours(1);
//    options.SlidingExpiration = true;
//    options.Cookie.HttpOnly = true;
//    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
//    options.Cookie.SameSite = SameSiteMode.Lax;
//    options.Events.OnRedirectToLogin = context =>
//    {
//        if (context.Request.Path.StartsWithSegments("/api"))
//        {
//            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
//            return Task.CompletedTask;
//        }

//        context.Response.Redirect(context.RedirectUri);
//        return Task.CompletedTask;
//    };
//})
//.AddOpenIdConnect(OpenIdConnectDefaults.AuthenticationScheme, options =>
//{
//    ConfigureOpenIdConnect(options, builder.Configuration, authProvider);
//});

//builder.Services.AddAuthorization(options =>
//{
//    options.FallbackPolicy = options.DefaultPolicy;
//});
builder.Services.AddAuthorization();

var routes = new List<RouteConfig>
{
    new()
    {
        RouteId = "api",
        ClusterId = "api",
        Match = new RouteMatch { Path = "/api/{**catch-all}" },
        Transforms =
        [
            new Dictionary<string, string> { ["PathRemovePrefix"] = "/api" }
        ]
    },
    new()
    {
        RouteId = "admin-frontend",
        ClusterId = "admin-frontend",
        Match = new RouteMatch { Path = "/{**catch-all}" },
        Order = 100
    }
};

var clusters = new List<ClusterConfig>
{
    new()
    {
        ClusterId = "api",
        Destinations = new Dictionary<string, DestinationConfig>
        {
            ["api"] = new() { Address = "https+http://api" }
        }
    },
    new()
    {
        ClusterId = "admin-frontend",
        Destinations = new Dictionary<string, DestinationConfig>
        {
            ["admin-frontend"] = new() { Address = "https+http://admin-frontend" }
        }
    }
};

builder.Services.AddReverseProxy()
    .LoadFromMemory(routes, clusters)
    .AddTransforms(builderContext =>
    {
        //builderContext.AddRequestTransform(async transformContext =>
        //{
        //    var accessToken = await transformContext.HttpContext.GetTokenAsync("access_token");
        //    if (!string.IsNullOrWhiteSpace(accessToken))
        //    {
        //        transformContext.ProxyRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        //    }
        //});
    })
    .AddServiceDiscoveryDestinationResolver();

builder.Services.AddHttpClient("token-client");

var app = builder.Build();

//app.UseForwardedHeaders(new ForwardedHeadersOptions
//{
//    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
//});

//app.UseCookiePolicy(new CookiePolicyOptions
//{
//    Secure = CookieSecurePolicy.Always,
//    MinimumSameSitePolicy = SameSiteMode.Lax,
//});

//app.Use((context, next) =>
//{
//    if (HttpMethods.IsGet(context.Request.Method) || context.Request.Path.StartsWithSegments("/bff"))
//    {
//        return next(context);
//    }

//    var antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();
//    return antiforgery.ValidateRequestAsync(context).ContinueWith(_ => next(context)).Unwrap();
//});

app.UseAuthentication();
app.UseAuthorization();

//app.MapGet("/bff/antiforgery", (IAntiforgery antiforgery, HttpContext httpContext) =>
//{
//    var tokens = antiforgery.GetAndStoreTokens(httpContext);
//    httpContext.Response.Cookies.Append("X-CSRF-TOKEN", tokens.RequestToken!, new CookieOptions
//    {
//        HttpOnly = false,
//        Secure = true,
//        SameSite = SameSiteMode.Lax
//    });
//    return Results.NoContent();
//});

app.MapFeatureModules();

if (app.Environment.IsDevelopment())
{
    app.MapReverseProxy();
}
else
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.MapReverseProxy();
    app.MapFallbackToFile("index.html");
}

app.Run();

static void ConfigureOpenIdConnect(OpenIdConnectOptions options, IConfiguration configuration, string provider)
{
    var section = configuration.GetSection($"Authentication:{provider}");
    section.Bind(options);

    options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.SaveTokens = true;
    options.ResponseType = OpenIdConnectResponseType.Code;
    options.UsePkce = true;
    options.GetClaimsFromUserInfoEndpoint = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = "name",
        RoleClaimType = "roles",
        ValidateAudience = true,
    };

    var scopes = section.GetSection("Scopes").Get<string[]>() ?? Array.Empty<string>();
    options.Scope.Clear();
    foreach (var scope in scopes)
    {
        options.Scope.Add(scope);
    }

    var requireHttps = section.GetValue<bool?>("RequireHttpsMetadata");
    if (requireHttps.HasValue)
    {
        options.RequireHttpsMetadata = requireHttps.Value;
    }
}

static string NormalizeUri(Uri uri)
{
    var text = uri.ToString().TrimEnd('/');
    return text + "/";
}


