# MeetupPlanner – Copilot Instructions

## Build & Run

```sh
# Build entire solution
dotnet build MeetupPlanner.slnx

# Run all tests
dotnet test MeetupPlanner.slnx

# Run a single test (TUnit via Microsoft Testing Platform)
dotnet test tests/MeetupPlanner.Api.IntegrationTests --filter "FullyQualifiedName~MyTestClass.MyTestMethod"

# Run the full app locally via .NET Aspire
dotnet run --project src/AppHost

# Run the API standalone
dotnet run --project src/MeetupPlanner.Api
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
| `MeetupPlanner.Admin` | Blazor Server admin UI |
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
Business logic lives in `Commands/` and `Queries/` folders under each feature. Handlers implement `IRequestHandler<TRequest, Result<TResponse>>` from `Infinity.Toolkit.Handlers`. Register them with:
```csharp
services.AddRequestHandler<MyQuery, Result<MyResponse>, MyHandler>();
```

### Result Pattern
All handlers return `Result<T>` (from `Infinity.Toolkit`). Use `Result.Success(value)` and `Result.Failure<T>("message")` or `Result.Failure<T>(exception)`. In endpoints, pattern-match on `ErrorResult<T>` vs `Success`.

### Validation
FluentValidation validators are decorated onto handlers using `ValidatorHandler<TCommand, TResponse>`:
```csharp
services.AddScoped<IValidator<MyCommand>, MyValidator>();
services.AddRequestHandler<MyCommand, Result<MyResponse>, MyHandler>()
    .Decorate<ValidatorHandler<MyCommand, MyResponse>>();
```

### MCP Server
The API exposes an MCP (Model Context Protocol) endpoint at `/mcp` (stateless HTTP transport). MCP tools are defined with `[McpServerToolType]` / `[McpServerTool]` attributes and use source-generated `JsonSerializerContext` for serialization.

### Response Types & JSON
- Response DTOs live in `MeetupPlanner.Shared` (for cross-project use) or inline in feature files.
- JSON is configured globally: null values omitted, enums as strings, `DateTimeOffset` serialized as UTC via `UtcDateTimeOffsetConverter`.
- `DateTimeOffset` properties for dates/times should be named with `Utc` suffix (e.g., `StartUtc`, `EndUtc`).

### EF Core
`MeetupPlannerDbContext` in `MeetupPlanner.Infrastructure`. Auditing columns (`CreatedBy`, `CreatedUtc`, `UpdatedBy`, `UpdatedUtc`) use `SetBeforeSaveBehavior`/`SetAfterSaveBehavior` to ignore client-set values — they are managed by database triggers. The `Meetup` table uses `.UseSqlOutputClause(false)` due to a trigger.

### Build Settings (Directory.Build.props)
- `TreatWarningsAsErrors=true` — all warnings must be resolved
- `Nullable=enable`, `ImplicitUsings=enable`, `LangVersion=latest`
- Global usings are declared in `Usings.cs` per project

### Tests
- Framework: **TUnit** (not xUnit/NUnit) with `Microsoft.Testing.Platform`
- Assertions: **Shouldly**
- Mocking: **NSubstitute**
- Integration tests use `TUnit.AspNetCore`'s `TestWebApplicationFactory<Program>` / `WebApplicationTest<,>` base classes
