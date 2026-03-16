using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.AspNetCore;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Extensions;
using MeetupPlanner.Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MeetupPlanner.Features.Presentations.Commands;

public static class AddPresentation
{
    public sealed record Command(AddPresentationRequest Presentation);

    public sealed record Response(Guid PresentationId);

    internal sealed class AddPresentationValidator : AbstractValidator<Command>
    {
        public AddPresentationValidator()
        {
            RuleFor(x => x.Presentation.Title)
                .NotEmpty().WithMessage("Title is required.")
                .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.");

            RuleFor(x => x.Presentation.Abstract)
                .NotEmpty().WithMessage("Abstract is required.")
                .MaximumLength(4000).WithMessage("Abstract cannot exceed 4000 characters.");

            RuleFor(x => x.Presentation.SpeakerId)
                .NotEmpty().WithMessage("SpeakerId is required.");
        }
    }

    internal sealed class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(
            IHandlerContext<Command> context,
            CancellationToken cancellationToken = default)
        {
            var speaker = await dbContext.Speakers
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    s => s.SpeakerId == context.Request.Presentation.SpeakerId,
                    cancellationToken);

            if (speaker == null)
            {
                return Result.Failure<Response>(
                    $"Speaker '{context.Request.Presentation.SpeakerId}' not found.");
            }

            var presentationId = Guid.NewGuid();
            var presentation = new Infrastructure.Models.Presentation
            {
                PresentationId = presentationId,
                Title = context.Request.Presentation.Title,
                Abstract = context.Request.Presentation.Abstract,
                DurationMinutes = 45,
                Status = "Scheduled",
                PresentationSpeakers =
                [
                    new Infrastructure.Models.PresentationSpeakerEntity
                    {
                        PresentationId = presentationId,
                        SpeakerId = speaker.SpeakerId,
                        IsPrimary = true
                    }
                ]
            };

            dbContext.Presentations.Add(presentation);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Result.Success(new Response(presentationId));
        }
    }

    public sealed record AddPresentationRequest
    {
        public string Title { get; init; } = string.Empty;

        public string Abstract { get; init; } = string.Empty;

        public Guid SpeakerId { get; init; }
    }

    public static void RegisterAddPresentation(this IServiceCollection services)
    {
        services.AddScoped<IValidator<Command>, AddPresentationValidator>();
        services.AddRequestHandler<Command, Result<Response>, Handler>()
            .Decorate<ValidatorHandler<Command, Response>>();
    }

    public static RouteGroupBuilder MapPostPresentation(this RouteGroupBuilder builder, string path)
    {
        builder.MapPost(path, async (AddPresentationRequest request, [FromServices] IRequestHandler<Command, Result<Response>> handler) =>
        {            
            var context = HandlerContextExtensions.Create(new Command(request));
            var result = await handler.HandleAsync(context);

            IResult response = result switch
            {
                ErrorResult<Response> failure => TypedResults.Problem(failure.ToProblemDetails()),
                Success => TypedResults.Created($"/{path}/{result.Value.PresentationId}", result.Value),
                _ => TypedResults.BadRequest("Failed to process request.")
            };

            return response;
        })
        .Accepts<AddPresentationRequest>("application/json")
        .Produces<Response>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest);

        return builder;
    }
}
