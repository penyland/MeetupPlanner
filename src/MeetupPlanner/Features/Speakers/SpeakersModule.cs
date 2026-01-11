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
using static MeetupPlanner.Features.Speakers.Commands.AddSpeakerBiography;

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
            .Decorate<ValidatorHandler<AddSpeaker.Command, AddSpeaker.Response>>();

        builder.Services.AddScoped<IValidator<UpdateSpeaker.Command>, UpdateSpeaker.UpdateSpeakerValidator>();
        builder.Services.AddRequestHandler<UpdateSpeaker.Command, Result<UpdateSpeaker.Response>, UpdateSpeaker.Handler>()
            .Decorate<ValidatorHandler<UpdateSpeaker.Command, UpdateSpeaker.Response>>();

        builder.Services.AddScoped<IValidator<AddSpeakerBiography.Command>, AddSpeakerBiographyValidator>();
        builder.Services.AddRequestHandler<AddSpeakerBiography.Command, Result<AddSpeakerBiography.Response>, AddSpeakerBiography.Handler>()
            .Decorate<ValidatorHandler<AddSpeakerBiography.Command, AddSpeakerBiography.Response>>();
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/meetupplanner")
            .WithTags("Speakers");

        group.MapGetRequestHandlerWithResult<GetSpeakers.Response, IReadOnlyList<SpeakerResponse>>("/speakers", map => map.Speakers);
        group.MapGetRequestHandlerWithResult<GetSpeaker.Query, GetSpeaker.Response, SpeakerDetailedResponse>("/speakers/{speakerId}", map => map.Speaker);
        group.MapGetRequestHandlerWithResult<GetSpeakerBiographies.Query, GetSpeakerBiographies.Response, IReadOnlyList<SpeakerBiographyResponse>>("/speakers/{speakerId}/biographies", map => map.SpeakerBiographies);
        group.MapGetRequestHandlerWithResult<GetSpeakerPresentations.Query, GetSpeakerPresentations.Response, IReadOnlyList<PresentationResponse>>("/speakers/{speakerId}/presentations", map => map.Presentations);

        group.MapPost("/speakers", async (SpeakerRequest request, [FromServices] IRequestHandler<AddSpeaker.Command, Result<AddSpeaker.Response>> handler) =>
        {
            var context = HandlerContextExtensions.Create(new AddSpeaker.Command(request));
            var result = await handler.HandleAsync(context);

            IResult response = result switch
            {
                ErrorResult<AddSpeaker.Response> validationFailure => TypedResults.BadRequest(validationFailure.Errors),
                //NotFoundFailure notFoundFailure => TypedResults.NotFound(notFoundFailure.Message),
                SuccessResult<AddSpeaker.Response> success => TypedResults.Created($"/meetupplanner/speakers/{success.Value.SpeakerId}", success.Value),
                _ => TypedResults.BadRequest("An error occurred while processing the request.")
            };

            return response;
        })
        .Accepts<SpeakerRequest>("application/json");

        group.MapPut("/speakers/{speakerId}", async (Guid speakerId, SpeakerRequest request, [FromServices] IRequestHandler<UpdateSpeaker.Command, Result<UpdateSpeaker.Response>> handler) =>
        {
            var context = HandlerContextExtensions.Create(new UpdateSpeaker.Command(speakerId, request));
            var result = await handler.HandleAsync(context);
            IResult response = result switch
            {
                ErrorResult<UpdateSpeaker.Response> validationFailure => TypedResults.BadRequest(validationFailure.Errors),
                //NotFoundFailure notFoundFailure => TypedResults.NotFound(notFoundFailure.Message),
                SuccessResult<UpdateSpeaker.Response> success => TypedResults.Ok(success.Value),
                _ => TypedResults.BadRequest("An error occurred while processing the request.")
            };
            return response;
        })
        .Accepts<SpeakerRequest>("application/json");

        group.MapPost("/speakers/{speakerId}/biographies", async (Guid speakerId, SpeakerBiographyRequest request, [FromServices] IRequestHandler<AddSpeakerBiography.Command, Result<AddSpeakerBiography.Response>> handler) =>
        {
            var context = HandlerContextExtensions.Create(new AddSpeakerBiography.Command(speakerId, request.Biography, request.IsPrimary));
            var result = await handler.HandleAsync(context);
            IResult response = result switch
            {
                ErrorResult<AddSpeakerBiography.Response> validationFailure => TypedResults.BadRequest(validationFailure.Errors),
                SuccessResult<AddSpeakerBiography.Response> success => TypedResults.Created($"/meetupplanner/speakers/{speakerId}/biographies/{success.Value.SpeakerBiographyId}"),
                _ => TypedResults.BadRequest("An error occurred while processing the request.")
            };
            return response;
        });
    }
}

