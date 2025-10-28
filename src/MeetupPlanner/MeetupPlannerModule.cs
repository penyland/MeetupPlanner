using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.AspNetCore;
using Infinity.Toolkit.FeatureModules;
using Infinity.Toolkit.Handlers;
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

        builder.Services.RegisterAddMeetup();

        builder.Services.AddRequestHandler<GetMeetups.Query, Result<GetMeetups.Response>, GetMeetups.Handler>();
        builder.Services.AddRequestHandler<GetMeetup.Query, Result<GetMeetup.Response>, GetMeetup.Handler>();
        builder.Services.AddRequestHandler<GetMeetupLocation.Query, Result<GetMeetupLocation.Response>, GetMeetupLocation.Handler>();
        builder.Services.AddRequestHandler<GetMeetupPresentations.Query, Result<GetMeetupPresentations.Response>, GetMeetupPresentations.Handler>();
        builder.Services.AddRequestHandler<GetMeetupRsvps.Query, Result<GetMeetupRsvps.Response>, GetMeetupRsvps.Handler>();

        builder.Services.AddRequestHandler<Result<GetPresentations.Response>, GetPresentations.Handler>();
        builder.Services.AddRequestHandler<GetPresentation.Query, Result<GetPresentation.Response>, GetPresentation.Handler>();

        builder.Services.AddRequestHandler<Result<GetSpeakers.Response>, GetSpeakers.Handler>();
        builder.Services.AddRequestHandler<GetSpeaker.Query, Result<GetSpeaker.Response>, GetSpeaker.Handler>();
        builder.Services.AddRequestHandler<GetSpeakerBiographies.Query, Result<GetSpeakerBiographies.Response>, GetSpeakerBiographies.Handler>();
        builder.Services.AddRequestHandler<GetSpeakerPresentations.Query, Result<GetSpeakerPresentations.Response>, GetSpeakerPresentations.Handler>();

        builder.Services.AddMcpServer()
            .WithHttpTransport(o => o.Stateless = true)
            .WithTools<MeetupPlannerMcpTools>();
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/meetupplanner")
            .WithTags("Meetup Planner");

        //group.MapGetLocations("/locations");
        //group.MapGetLocation("/locations/{locationId}");
        //group.MapPostLocation("/locations");

        group.MapPostMeetup("/meetups");

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

        group.MapGetRequestHandlerWithResult<GetPresentations.Response, IReadOnlyList<PresentationResponse>>("/presentations", map => map.Presentations);
        group.MapGetRequestHandlerWithResult<GetPresentation.Query, GetPresentation.Response, PresentationDetailedResponse>("/presentations/{presentationId}", map => map.Presentation);

        group.MapGetRequestHandlerWithResult<GetSpeakers.Response, IReadOnlyList<SpeakerResponse>>("/speakers", map => map.Speakers);
        group.MapGetRequestHandlerWithResult<GetSpeaker.Query, GetSpeaker.Response, SpeakerDetailedResponse>("/speakers/{speakerId}", map => map.Speaker);
        group.MapGetRequestHandlerWithResult<GetSpeakerBiographies.Query, GetSpeakerBiographies.Response, IReadOnlyList<SpeakerBiographyDto>>("/speakers/{speakerId}/biographies", map => map.SpeakerBiographies);
        group.MapGetRequestHandlerWithResult<GetSpeakerPresentations.Query, GetSpeakerPresentations.Response, IReadOnlyList<PresentationResponse>>("/speakers/{speakerId}/presentations", map => map.Presentations);

        //group.MapMcp("/mcp").RequireAuthorization();
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
