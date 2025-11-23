using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.AspNetCore;
using Infinity.Toolkit.FeatureModules;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Extensions;
using MeetupPlanner.Features.Speakers.Commands;
using MeetupPlanner.Features.Speakers.Queries;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using static MeetupPlanner.Features.Speakers.Commands.AddSpeaker;

namespace MeetupPlanner.Features.Speakers;

internal class SpeakersModule : WebFeatureModule
{
    public override IModuleInfo ModuleInfo { get; } = new FeatureModuleInfo(typeof(SpeakersModule).FullName, typeof(SpeakersModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.Services.AddMcpServer()
            .WithHttpTransport(o => o.Stateless = true)
            .WithTools<McpTools>();

        builder.Services.AddRequestHandler<Result<GetSpeakers.Response>, GetSpeakers.Handler>();
        builder.Services.AddRequestHandler<GetSpeaker.Query, Result<GetSpeaker.Response>, GetSpeaker.Handler>();
        builder.Services.AddRequestHandler<GetSpeakerBiographies.Query, Result<GetSpeakerBiographies.Response>, GetSpeakerBiographies.Handler>();
        builder.Services.AddRequestHandler<GetSpeakerPresentations.Query, Result<GetSpeakerPresentations.Response>, GetSpeakerPresentations.Handler>();

        builder.Services.AddScoped<IValidator<AddSpeaker.Command>, AddSpeaker.AddSpeakerValidator>();
        builder.Services.AddRequestHandler<AddSpeaker.Command, Result<AddSpeaker.Response>, AddSpeaker.Handler>()
            .Decorate<AddSpeaker.ValidatorHandler>();
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/meetupplanner")
            .WithTags("Meetup Planner");

        group.MapGetRequestHandlerWithResult<GetSpeakers.Response, IReadOnlyList<SpeakerResponse>>("/speakers", map => map.Speakers);
        group.MapGetRequestHandlerWithResult<GetSpeaker.Query, GetSpeaker.Response, SpeakerDetailedResponse>("/speakers/{speakerId}", map => map.Speaker);
        group.MapGetRequestHandlerWithResult<GetSpeakerBiographies.Query, GetSpeakerBiographies.Response, IReadOnlyList<SpeakerBiographyDto>>("/speakers/{speakerId}/biographies", map => map.SpeakerBiographies);
        group.MapGetRequestHandlerWithResult<GetSpeakerPresentations.Query, GetSpeakerPresentations.Response, IReadOnlyList<PresentationResponse>>("/speakers/{speakerId}/presentations", map => map.Presentations);

        group.MapPost("/speakers", async (SpeakerRequest request, [FromServices] IRequestHandler<Command, Result<Response>> handler) =>
        {
            var context = HandlerContextExtensions.Create(new Command(request));
            var result = await handler.HandleAsync(context);

            IResult response = result switch
            {
                ErrorResult<Response> validationFailure => TypedResults.BadRequest(validationFailure.Errors),
                //NotFoundFailure notFoundFailure => TypedResults.NotFound(notFoundFailure.Message),
                SuccessResult<Response> success => TypedResults.Created($"/meetupplanner/speakers/{success.Value.SpeakerId}", success.Value),
                _ => TypedResults.BadRequest("An error occurred while processing the request.")
            };

            return response;
        })
        .Accepts<SpeakerRequest>("application/json");
    }
}
