using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.FeatureModules;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Extensions;
using MeetupPlanner.Features.Locations.Commands;
using MeetupPlanner.Features.Locations.Queries;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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

        builder.Services.AddScoped<IValidator<UpdateLocation.Command>, UpdateLocation.UpdateLocationValidator>();
        builder.Services.AddRequestHandler<UpdateLocation.Command, Result<UpdateLocation.Response>, UpdateLocation.Handler>()
            .Decorate<ValidatorHandler<UpdateLocation.Command, UpdateLocation.Response>>();

        builder.Services.AddMcpServer()
            .WithHttpTransport(o => o.Stateless = true)
            .WithTools<McpTools>();
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/meetupplanner")
            .WithTags("Locations");

        group.MapGetLocations("/locations");
        group.MapGetLocation("/locations/{locationId}");
        group.MapPostLocation("/locations");

        group.MapPut("/locations/{locationId}", async (Guid locationId, [FromBody] AddLocation.LocationRequest request, [FromServices] IRequestHandler<UpdateLocation.Command, Result<UpdateLocation.Response>> handler) =>
        {
            var context = HandlerContextExtensions.Create(new UpdateLocation.Command(locationId, request));
            var result = await handler.HandleAsync(context);
            IResult response = result switch
            {
                ErrorResult<UpdateLocation.Response> validationFailure => TypedResults.BadRequest(validationFailure.Errors),
                SuccessResult<UpdateLocation.Response> success => TypedResults.Ok(success.Value),
                _ => TypedResults.BadRequest("An error occurred while processing the request.")
            };
            return response;
        })
        .Accepts<AddLocation.LocationRequest>("application/json");
    }
}
