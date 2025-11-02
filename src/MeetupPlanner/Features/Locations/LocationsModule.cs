using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.FeatureModules;
using Infinity.Toolkit.Handlers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace MeetupPlanner.Features.Locations;

public class LocationsModule : WebFeatureModule
{
    public override IModuleInfo ModuleInfo { get; } = new FeatureModuleInfo(typeof(LocationsModule).FullName, typeof(LocationsModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.Services.AddRequestHandler<AddLocation.Command, Result<AddLocation.Response>, AddLocation.Handler>()
            .Decorate<AddLocation.ValidatorHandler>();

        builder.Services.AddScoped<IValidator<AddLocation.Command>, AddLocation.CommandValidator>();

        builder.Services.AddRequestHandler<Result<GetLocations.Response>, GetLocations.Handler>();
        builder.Services.AddRequestHandler<GetLocation.Query, Result<GetLocation.Response>, GetLocation.Handler>();

        builder.Services.AddMcpServer()
            .WithHttpTransport(o => o.Stateless = true)
            .WithTools<McpTools>();
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/meetupplanner")
            .WithTags("Meetup Planner");

        group.MapGetLocations("/locations");
        group.MapGetLocation("/locations/{locationId}");
        group.MapPostLocation("/locations");
    }
}
