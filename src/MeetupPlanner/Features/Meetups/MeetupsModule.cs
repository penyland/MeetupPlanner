using Infinity.Toolkit;
using Infinity.Toolkit.AspNetCore;
using Infinity.Toolkit.FeatureModules;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Extensions;
using MeetupPlanner.Features.Meetups.Commands;
using MeetupPlanner.Features.Meetups.Queries;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace MeetupPlanner.Features.Meetups;

public class MeetupsModule : WebFeatureModule
{
    public override IModuleInfo ModuleInfo { get; } = new FeatureModuleInfo(typeof(MeetupsModule).FullName, typeof(MeetupsModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.Services.RegisterAddMeetup();
        builder.Services.RegisterUpdateMeetupRsvps();

        builder.Services.AddRequestHandler<GetMeetups.Query, Result<GetMeetups.Response>, GetMeetups.Handler>();
        builder.Services.AddRequestHandler<GetMeetup.Query, Result<GetMeetup.Response>, GetMeetup.Handler>();
        builder.Services.AddRequestHandler<GetMeetupLocation.Query, Result<GetMeetupLocation.Response>, GetMeetupLocation.Handler>();
        builder.Services.AddRequestHandler<GetMeetupPresentations.Query, Result<GetMeetupPresentations.Response>, GetMeetupPresentations.Handler>();
        builder.Services.AddRequestHandler<GetMeetupRsvps.Query, Result<GetMeetupRsvps.Response>, GetMeetupRsvps.Handler>();
        builder.Services.AddRequestHandler<GetRsvps.Query, Result<GetRsvps.Response>, GetRsvps.Handler>();
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/meetupplanner").WithTags("Meetup Planner");

        group.MapPostMeetup("/meetups");

        group.MapPut("/meetups/{meetupId}/rsvps", async ([FromRoute] Guid meetupId, UpdateMeetupRsvps.Command command, IRequestHandler<UpdateMeetupRsvps.Command, Result<UpdateMeetupRsvps.Response>> handler) =>
        {
            var result = await handler.HandleAsync(HandlerContextExtensions.Create(command with { MeetupId = meetupId }));
            return result.Succeeded ? TypedResults.NoContent() : Results.BadRequest(result.Errors);
        });

        group.MapGet("/meetups", async (IRequestHandler<GetMeetups.Query, Result<GetMeetups.Response>> handler, [AsParameters] MeetupQueryParameters queryParams) =>
        {
            var meetupStatus = MeetupStatus.All;
            if (queryParams.Status is not null && !queryParams.TryParseStatus(out meetupStatus))
            {
                return Results.BadRequest($"Invalid status '{queryParams.Status}'");
            }

            var response = await handler.HandleAsync(new HandlerContext<GetMeetups.Query> { Request = new GetMeetups.Query(meetupStatus) });

            return response is Failure ?
                TypedResults.Problem(response.ToProblemDetails()) :
                TypedResults.Json(response.Value.Meetups);
        })
        .Produces<IReadOnlyList<MeetupResponse>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest);

        group.MapGetRequestHandlerWithResult<GetMeetup.Query, GetMeetup.Response, MeetupResponse>("/meetups/{meetupId}", map => map.Meetup);
        group.MapGetRequestHandlerWithResult<GetMeetupLocation.Query, GetMeetupLocation.Response, LocationDetailedResponse>("/meetups/{meetupId}/location", map => map.Location);
        group.MapGetRequestHandlerWithResult<GetMeetupPresentations.Query, GetMeetupPresentations.Response, IReadOnlyList<PresentationResponse>>("/meetups/{meetupId}/presentations", map => map.Presentations);
        group.MapGetRequestHandlerWithResult<GetMeetupRsvps.Query, GetMeetupRsvps.Response, Rsvp>("/meetups/{meetupId}/rsvps", map => map.Rsvp);
        group.MapGetRequestHandlerWithResult<GetRsvps.Query, GetRsvps.Response, IReadOnlyList<RsvpResponse>>("/meetups/rsvps", map => map.Rsvps);
    }
}


// Model for query parameters
public class MeetupQueryParameters
{
    public string? Status { get; set; }

    public bool TryParseStatus(out MeetupStatus statusEnum)
    {
        return Enum.TryParse(Status, true, out statusEnum);
    }
}
