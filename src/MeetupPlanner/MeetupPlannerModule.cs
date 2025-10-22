using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.AspNetCore;
using Infinity.Toolkit.FeatureModules;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Extensions;
using MeetupPlanner.Features.Common;
using MeetupPlanner.Features.Locations;
using MeetupPlanner.Features.Meetups;
using MeetupPlanner.Features.Presentations;
using MeetupPlanner.Features.Speakers;
using MeetupPlanner.Infrastructure;
using MeetupPlanner.MCP;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace MeetupPlanner;

public class MeetupPlannerModule : WebFeatureModule
{
    public override IModuleInfo? ModuleInfo { get; } = new FeatureModuleInfo(nameof(MeetupPlannerModule), typeof(MeetupPlannerModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.AddSqlServerDbContext<MeetupPlannerDbContext>("MeetupPlanner");

        builder.Services.AddRequestHandler<AddLocation.Command, AddLocation.Response, AddLocation.Handler>()
            .Decorate<AddLocation.ValidatorHandler>();

        builder.Services.AddScoped<IValidator<AddLocation.Command>, AddLocation.CommandValidator>();

        builder.Services.AddRequestHandler<GetLocations.Response, GetLocations.Handler>();
        builder.Services.AddRequestHandler<GetLocation.Query, GetLocation.Response, GetLocation.Handler>();

        builder.Services.AddRequestHandler<GetMeetups.Query, GetMeetups.Response, GetMeetups.Handler>();
        builder.Services.AddRequestHandler<GetMeetup.Query, GetMeetup.Response, GetMeetup.Handler>();
        builder.Services.AddRequestHandler<GetMeetupLocation.Query, GetMeetupLocation.Response, GetMeetupLocation.Handler>();
        builder.Services.AddRequestHandler<GetMeetupPresentations.Query, GetMeetupPresentations.Response, GetMeetupPresentations.Handler>();
        builder.Services.AddRequestHandler<GetMeetupRsvps.Query, GetMeetupRsvps.Response, GetMeetupRsvps.Handler>();

        builder.Services.AddRequestHandler<GetPresentations.Response, GetPresentations.Handler>();
        builder.Services.AddRequestHandler<GetPresentation.Query, GetPresentation.Response, GetPresentation.Handler>();

        builder.Services.AddRequestHandler<GetSpeakers.Response, GetSpeakers.Handler>();
        builder.Services.AddRequestHandler<GetSpeaker.Query, GetSpeaker.Response, GetSpeaker.Handler>();
        builder.Services.AddRequestHandler<GetSpeakerBiographies.Query, GetSpeakerBiographies.Response, GetSpeakerBiographies.Handler>();
        builder.Services.AddRequestHandler<GetSpeakerPresentations.Query, GetSpeakerPresentations.Response, GetSpeakerPresentations.Handler>();

        builder.Services.AddMcpServer()
            .WithHttpTransport(o => o.Stateless = true)
            .WithTools<MeetupPlannerMcpTools>();
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/meetupplanner")
            .WithTags("Meetup Planner");

        group.MapGetHandler<GetLocations.Response, IReadOnlyList<LocationResponse>>("/locations", map => map.Locations);

        //group.MapGetHandler<GetLocation.Query, GetLocation.Response, LocationDetailedResponse>("/locations/{locationId}", map => map.Location);

        group.MapGetLocation();
        group.MapPostLocation().RequireAuthorization();

        group.MapGet("/meetups", async (IRequestHandler<GetMeetups.Query, GetMeetups.Response> handler, [AsParameters] MeetupQueryParameters queryParams) =>
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

        group.MapGetHandler<GetMeetup.Query, GetMeetup.Response, MeetupResponse>("/meetups/{meetupId}", map => map.Meetup);
        group.MapGetHandler<GetMeetupLocation.Query, GetMeetupLocation.Response, LocationDetailedResponse>("/meetups/{meetupId}/location", map => map.Location);
        group.MapGetHandler<GetMeetupPresentations.Query, GetMeetupPresentations.Response, IReadOnlyList<PresentationResponse>>("/meetups/{meetupId}/presentations", map => map.Presentations);
        group.MapGetHandler<GetMeetupRsvps.Query, GetMeetupRsvps.Response, Rsvp>("/meetups/{meetupId}/rsvps", map => map.Rsvp);

        group.MapGetHandler<GetPresentations.Response, IReadOnlyList<PresentationResponse>>("/presentations", map => map.Presentations);
        group.MapGetHandler<GetPresentation.Query, GetPresentation.Response, PresentationDetailedResponse>("/presentations/{presentationId}", map => map.Presentation);

        group.MapGetHandler<GetSpeakers.Response, IReadOnlyList<SpeakerResponse>>("/speakers", map => map.Speakers);
        group.MapGetHandler<GetSpeaker.Query, GetSpeaker.Response, SpeakerDetailedResponse>("/speakers/{speakerId}", map => map.Speaker);
        group.MapGetHandler<GetSpeakerBiographies.Query, GetSpeakerBiographies.Response, IReadOnlyList<SpeakerBiographyDto>>("/speakers/{speakerId}/biographies", map => map.SpeakerBiographies);
        group.MapGetHandler<GetSpeakerPresentations.Query, GetSpeakerPresentations.Response, IReadOnlyList<PresentationResponse>>("/speakers/{speakerId}/presentations", map => map.Presentations);

        group.MapMcp("/mcp").RequireAuthorization();
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
