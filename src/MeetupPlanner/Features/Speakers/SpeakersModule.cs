using Infinity.Toolkit;
using Infinity.Toolkit.AspNetCore;
using Infinity.Toolkit.FeatureModules;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Features.Common;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

namespace MeetupPlanner.Features.Speakers;

internal class SpeakersModule : WebFeatureModule
{
    public override IModuleInfo? ModuleInfo { get; } = new FeatureModuleInfo(typeof(SpeakersModule).FullName, typeof(SpeakersModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.Services.AddRequestHandler<Result<GetSpeakers.Response>, GetSpeakers.Handler>();
        builder.Services.AddRequestHandler<GetSpeaker.Query, Result<GetSpeaker.Response>, GetSpeaker.Handler>();
        builder.Services.AddRequestHandler<GetSpeakerBiographies.Query, Result<GetSpeakerBiographies.Response>, GetSpeakerBiographies.Handler>();
        builder.Services.AddRequestHandler<GetSpeakerPresentations.Query, Result<GetSpeakerPresentations.Response>, GetSpeakerPresentations.Handler>();
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/meetupplanner")
            .WithTags("Meetup Planner");

        group.MapGetRequestHandlerWithResult<GetSpeakers.Response, IReadOnlyList<SpeakerResponse>>("/speakers", map => map.Speakers);
        group.MapGetRequestHandlerWithResult<GetSpeaker.Query, GetSpeaker.Response, SpeakerDetailedResponse>("/speakers/{speakerId}", map => map.Speaker);
        group.MapGetRequestHandlerWithResult<GetSpeakerBiographies.Query, GetSpeakerBiographies.Response, IReadOnlyList<SpeakerBiographyDto>>("/speakers/{speakerId}/biographies", map => map.SpeakerBiographies);
        group.MapGetRequestHandlerWithResult<GetSpeakerPresentations.Query, GetSpeakerPresentations.Response, IReadOnlyList<PresentationResponse>>("/speakers/{speakerId}/presentations", map => map.Presentations);
    }
}
