# MeetupPlanner – Copilot Instructions

## Build & Run

```sh
# Build entire solution
dotnet build MeetupPlanner.slnx

# Run all tests
dotnet test MeetupPlanner.slnx

# Run a single test (TUnit via Microsoft Testing Platform)
dotnet test tests/MeetupPlanner.Api.IntegrationTests --filter "FullyQualifiedName~MyTestClass.MyTestMethod"

# Run the full app locally via .NET Aspire (recommended)
dotnet run --project src/AppHost

# Run the API standalone (requires SQL Server on port 1433)
dotnet run --project src/MeetupPlanner.Api

# Publish API as a container image
dotnet publish src/MeetupPlanner.Api -t:PublishContainer -p:ContainerImageTags=latest -p:ContainerRepository=meetupplanner/api
```

### Frontend (src/Web – SvelteKit)
```sh
cd src/Web
npm run dev        # dev server
npm run build      # production build
npm run lint       # prettier + eslint
npm run check      # svelte-check type checking
```

### Frontend (src/MeetupPlanner.AdminReact – React)
```sh
cd src/MeetupPlanner.AdminReact
npm run dev        # dev server
npm run build      # tsc + vite build
npm run lint       # eslint
```

## Architecture

This is a multi-project .NET 10 solution orchestrated by **.NET Aspire** (`src/AppHost`). The main components are:

| Project | Role |
|---|---|
| `MeetupPlanner.Api` | ASP.NET Core minimal API – the primary backend |
| `MeetupPlanner` | Core domain library – all business logic, EF Core, feature modules |
| `MeetupPlanner.Bff` | Backend-for-frontend (cookie auth via Keycloak) serving the React admin |
| `MeetupPlanner.AdminReact` | React 19 + Vite admin frontend (served through the BFF) |
| `Web` | SvelteKit 5 public-facing frontend |
| `MeetupPlanner.Proxy` | YARP reverse proxy (currently WIP) |
| `MeetupPlanner.ServiceDefaults` | Shared Aspire service defaults (telemetry, health checks) |
| `MeetupPlanner.Shared` | Shared DTOs and response types referenced by multiple projects |

**Data flow:** SvelteKit/React UIs → `MeetupPlanner.Api` (JWT-protected minimal API) → SQL Server via EF Core (`MeetupPlannerDbContext`). The BFF handles Keycloak OIDC for the React admin and proxies calls to the API.

**Database:** SQL Server. Connection string name is `"MeetupPlanner"`. The Aspire AppHost wires this up via `builder.AddConnectionString("MeetupPlanner")`.

**Authentication:** Keycloak (realm: `meetupplanner`). The API validates Keycloak JWT bearer tokens. For local dev without Aspire, use `dotnet user-jwts` (see README for the `ValidIssuers` SDK bug workaround).

## Key Conventions

### Feature Module Pattern
All features use `Infinity.Toolkit.FeatureModules`. Each feature area implements `WebFeatureModule` with:
- `RegisterModule(IHostApplicationBuilder)` – register DI services
- `MapEndpoints(WebApplication)` – map minimal API routes

Features are discovered automatically via `builder.AddFeatureModules()` / `app.MapFeatureModules()` in `Program.cs`. To add a new feature area, create a class inheriting `WebFeatureModule`.

### CQRS-style Handlers
Business logic lives in `Commands/` and `Queries/` folders under each feature. Each handler file uses a **single static class** containing all related types:
```csharp
public static class AddSpeaker
{
    public sealed record Command(SpeakerRequest Speaker);
    public sealed record Response(Guid SpeakerId);

    internal sealed class Handler(MeetupPlannerDbContext dbContext)
        : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context,
            CancellationToken cancellationToken = default) { ... }
    }

    internal sealed class AddSpeakerValidator : AbstractValidator<Command> { ... }
}
```

For queries with no request parameters, use the parameterless variant:
```csharp
// No-parameter query
internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Result<Response>>
{
    public async Task<Result<Response>> HandleAsync(CancellationToken cancellationToken) { ... }
}
```

Register handlers in the feature module:
```csharp
// With request parameter
services.AddRequestHandler<MyQuery, Result<MyResponse>, MyHandler>();
// Without request parameter
services.AddRequestHandler<Result<MyResponse>, MyHandler>();
```

### Endpoint Mapping
Routes are grouped under `/meetupplanner/` and organised by feature tag. Use the framework extension for simple GET projections, or write manual lambdas for custom logic:

```csharp
var group = app.MapGroup("/meetupplanner").WithTags("Speakers");

// Auto-projected GET (no-param handler)
group.MapGetRequestHandlerWithResult<GetSpeakers.Response, IReadOnlyList<SpeakerResponse>>(
    "/speakers", map => map.Speakers);

// Auto-projected GET with route parameter
group.MapGetRequestHandlerWithResult<GetSpeaker.Query, GetSpeaker.Response, SpeakerDetailedResponse>(
    "/speakers/{speakerId}", map => map.Speaker);

// Manual endpoint (needed for non-GET or custom response shaping)
group.MapPost("/speakers", async (SpeakerRequest request,
    [FromServices] IRequestHandler<AddSpeaker.Command, Result<AddSpeaker.Response>> handler) =>
{
    var context = HandlerContextExtensions.Create(new AddSpeaker.Command(request));
    var result = await handler.HandleAsync(context);
    return result switch
    {
        ErrorResult<AddSpeaker.Response> err => TypedResults.BadRequest(err.Errors),
        SuccessResult<AddSpeaker.Response> ok =>
            TypedResults.Created($"/meetupplanner/speakers/{ok.Value.SpeakerId}", ok.Value),
        _ => TypedResults.BadRequest("An error occurred.")
    };
}).Accepts<SpeakerRequest>("application/json");
```

### Result Pattern
All handlers return `Result<T>` (from `Infinity.Toolkit`). Use `Result.Success(value)` and `Result.Failure<T>("message")` or `Result.Failure<T>(exception)`. In endpoints, pattern-match on `ErrorResult<T>` vs `SuccessResult<T>`.

### Validation
FluentValidation validators are decorated onto handlers using `ValidatorHandler<TCommand, TResponse>`:
```csharp
services.AddScoped<IValidator<MyCommand>, MyValidator>();
services.AddRequestHandler<MyCommand, Result<MyResponse>, MyHandler>()
    .Decorate<ValidatorHandler<MyCommand, MyResponse>>();
```

### MCP Server
The API exposes an MCP (Model Context Protocol) endpoint at `/mcp` (stateless HTTP transport). MCP tools are defined with `[McpServerToolType]` / `[McpServerTool]` attributes and use source-generated `JsonSerializerContext` for serialization. Each tool class that requires JSON output must define its own `[JsonSerializable]`-annotated `JsonSerializerContext`:

```csharp
[McpServerToolType]
public class McpTools(MeetupPlannerDbContext dbContext)
{
    [McpServerTool]
    [Description("Get a list of speakers.")]
    public async Task<string> GetSpeakersAsync()
    {
        var speakers = await dbContext.Speakers.AsNoTracking().ToListAsync();
        return JsonSerializer.Serialize(speakers,
            MeetupPlannerSerializationContext.Default.ListSpeakerResponse);
    }
}

[JsonSerializable(typeof(List<SpeakerResponse>))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
internal sealed partial class MeetupPlannerSerializationContext : JsonSerializerContext;
```

### Response Types & JSON
- Response DTOs live in `MeetupPlanner.Shared` (for cross-project use) or inline in feature files.
- JSON is configured globally: null values omitted, enums as strings, `DateTimeOffset` serialized as UTC via `UtcDateTimeOffsetConverter`.
- `DateTimeOffset` properties for dates/times should be named with `Utc` suffix (e.g., `StartUtc`, `EndUtc`).

### EF Core
`MeetupPlannerDbContext` is in `src/MeetupPlanner/Infrastructure/`. It is registered by `MeetupPlannerModule` (the root feature module) via:
```csharp
builder.AddSqlServerDbContext<MeetupPlannerDbContext>("MeetupPlanner");
```
Auditing columns (`CreatedBy`, `CreatedUtc`, `UpdatedBy`, `UpdatedUtc`) use `SetBeforeSaveBehavior`/`SetAfterSaveBehavior` to ignore client-set values — they are managed by database triggers. The `Meetup` table uses `.UseSqlOutputClause(false)` due to a trigger.

### Build Settings (Directory.Build.props)
- `TreatWarningsAsErrors=true` — all warnings must be resolved
- `Nullable=enable`, `ImplicitUsings=enable`, `LangVersion=latest`
- `GenerateDocumentationFile=true` — XML docs generated; suppress CS1591 (missing XML comment) with `NoWarn`
- Global usings are declared in `Usings.cs` per project

### Frontend Conventions
**SvelteKit (`src/Web`):** API calls use a typed client at `src/lib/api/client.ts` wrapping native `fetch()`. All endpoints are prefixed `/meetupplanner/`. Page data is loaded via SvelteKit `load` functions in `+page.ts`.

**React Admin (`src/MeetupPlanner.AdminReact`):** API calls use **Axios** via a shared `apiClient` instance (`src/services/apiClient.ts`). Business logic is in static service classes under `src/services/`. All endpoints are prefixed `/api/meetupplanner/` (the BFF strips `/api` before forwarding to the backend).

### BFF (MeetupPlanner.Bff)
Handles Keycloak OIDC cookie authentication and proxies two route groups via YARP:
- `/api/{**catch-all}` → API service (prefix `/api` stripped before forwarding)
- `/{**catch-all}` (catch-all, order 100) → React admin frontend static files

Service-to-service addresses use Aspire service discovery (`https+http://api`, `https+http://admin-frontend`).

### Tests
- Framework: **TUnit** (not xUnit/NUnit) with `Microsoft.Testing.Platform`
- Assertions: **Shouldly**
- Mocking: **NSubstitute**
- Integration tests use `TUnit.AspNetCore`'s `TestWebApplicationFactory<Program>` / `WebApplicationTest<,>` base classes. Extend `IntegrationTestsBase` (which extends `WebApplicationTest<WebApplicationFactory, Program>`) for each integration test class. Override `ConfigureWebHost` in `WebApplicationFactory` to swap services or add config for test scenarios.
