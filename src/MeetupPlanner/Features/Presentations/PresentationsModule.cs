using Infinity.Toolkit;
using Infinity.Toolkit.AspNetCore;
using Infinity.Toolkit.FeatureModules;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Features.Common;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

namespace MeetupPlanner.Features.Presentations;

internal class PresentationsModule : WebFeatureModule
{
    public override IModuleInfo ModuleInfo { get; } = new FeatureModuleInfo(typeof(PresentationsModule).FullName, typeof(PresentationsModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.Services.AddRequestHandler<Result<GetPresentations.Response>, GetPresentations.Handler>();
        builder.Services.AddRequestHandler<GetPresentation.Query, Result<GetPresentation.Response>, GetPresentation.Handler>();

    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/meetupplanner")
            .WithTags("Meetup Planner");


        group.MapGetRequestHandlerWithResult<GetPresentations.Response, IReadOnlyList<PresentationResponse>>("/presentations", map => map.Presentations);
        group.MapGetRequestHandlerWithResult<GetPresentation.Query, GetPresentation.Response, PresentationDetailedResponse>("/presentations/{presentationId}", map => map.Presentation);
    }
}
