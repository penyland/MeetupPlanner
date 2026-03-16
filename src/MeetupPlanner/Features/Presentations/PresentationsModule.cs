using Infinity.Toolkit;
using Infinity.Toolkit.AspNetCore;
using Infinity.Toolkit.FeatureModules;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Extensions;
using MeetupPlanner.Features.Presentations.Commands;
using MeetupPlanner.Features.Presentations.Queries;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace MeetupPlanner.Features.Presentations;

internal class PresentationsModule : WebFeatureModule
{
    public override IModuleInfo ModuleInfo { get; } = new FeatureModuleInfo(typeof(PresentationsModule).FullName, typeof(PresentationsModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.Services.RegisterAddPresentation();
        builder.Services.RegisterUpdatePresentation();
        builder.Services.RegisterDeletePresentation();
        builder.Services.AddRequestHandler<Result<GetPresentations.Response>, GetPresentations.Handler>();
        builder.Services.AddRequestHandler<GetPresentation.Query, Result<GetPresentation.Response>, GetPresentation.Handler>();
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/meetupplanner")
            .WithTags("Presentations");

        group.MapPostPresentation("/presentations");
        group.MapGetRequestHandlerWithResult<GetPresentations.Response, IReadOnlyList<PresentationResponse>>("/presentations", map => map.Presentations);
        group.MapGetRequestHandlerWithResult<GetPresentation.Query, GetPresentation.Response, PresentationDetailedResponse>("/presentations/{presentationId}", map => map.Presentation);

        group.MapPut("/presentations/{presentationId}", async ([FromRoute] Guid presentationId, UpdatePresentation.UpdatePresentationRequest request, IRequestHandler<UpdatePresentation.Command, Result<UpdatePresentation.Response>> handler) =>
        {
            var result = await handler.HandleAsync(HandlerContextExtensions.Create(new UpdatePresentation.Command(presentationId, request)));
            return result.Succeeded ? TypedResults.NoContent() : Results.BadRequest(result.Errors);
        });

        group.MapDelete("/presentations/{presentationId}", async ([FromRoute] Guid presentationId, IRequestHandler<DeletePresentation.Command, Result<DeletePresentation.Response>> handler) =>
        {
            var result = await handler.HandleAsync(HandlerContextExtensions.Create(new DeletePresentation.Command(presentationId)));
            return result.Succeeded ? TypedResults.NoContent() : Results.BadRequest(result.Errors);
        });
    }
}
