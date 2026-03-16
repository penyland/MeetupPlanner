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

namespace MeetupPlanner.Features.Meetups.Commands;

public static class UpdateMeetup
{
    public sealed record Command(Guid MeetupId, UpdateMeetupRequest Meetup);

    public sealed record Response();

    internal sealed class UpdateMeetupValidator : AbstractValidator<Command>
    {
        public UpdateMeetupValidator()
        {
            RuleFor(x => x.Meetup.Title)
                .NotEmpty().WithMessage("Title is required.")
                .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.");

            RuleFor(x => x.Meetup.Description)
                .NotEmpty().WithMessage("Description is required.")
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.");

            RuleFor(x => x.Meetup.StartUtc)
                .NotEmpty().WithMessage("StartUtc is required.");

            RuleFor(x => x.Meetup.EndUtc)
                .NotEmpty().WithMessage("EndUtc is required.")
                .GreaterThan(x => x.Meetup.StartUtc).WithMessage("EndUtc must be after StartUtc.");

            RuleFor(x => x.Meetup.TotalSpots)
                .GreaterThanOrEqualTo(0).WithMessage("TotalSpots must be a non-negative integer.");

            RuleFor(x => x.Meetup.Status)
                .NotEmpty().WithMessage("Status is required.")
                .IsInEnum().WithMessage("Status must be a valid enum value.");

            RuleFor(x => x.Meetup.LocationId)
                .NotEmpty().WithMessage("Location is required.");
        }
    }

    internal sealed class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            var meetup = await dbContext.Meetups
                .Include(m => m.ScheduleSlots)
                .SingleOrDefaultAsync(m => m.MeetupId == context.Request.MeetupId, cancellationToken);

            if (meetup == null)
            {
                return Result.Failure<Response>($"Meetup with ID '{context.Request.MeetupId}' not found.");
            }

            meetup.Title = context.Request.Meetup.Title;
            meetup.Description = context.Request.Meetup.Description;
            meetup.StartUtc = context.Request.Meetup.StartUtc;
            meetup.EndUtc = context.Request.Meetup.EndUtc;
            meetup.TotalSpots = context.Request.Meetup.TotalSpots;
            meetup.Status = context.Request.Meetup.Status.ToString();
            meetup.LocationId = context.Request.Meetup.LocationId;

            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex)
            {
                return Result.Failure<Response>(ex);
            }

            return Result.Success(new Response());
        }
    }

    public record UpdateMeetupRequest
    {
        public string Title { get; init; } = string.Empty;

        public string Description { get; init; } = string.Empty;

        public DateTimeOffset StartUtc { get; init; }

        public DateTimeOffset EndUtc { get; init; }

        public int TotalSpots { get; init; } = 0;

        public MeetupStatus Status { get; init; } = MeetupStatus.Scheduled;

        public Guid LocationId { get; init; } = Guid.Empty;

        public IReadOnlyList<Guid> PresentationIds { get; init; } = [];
    }

    public static void RegisterUpdateMeetup(this IServiceCollection services)
    {
        services.AddScoped<IValidator<Command>, UpdateMeetupValidator>();
        services.AddRequestHandler<Command, Result<Response>, Handler>()
            .Decorate<ValidatorHandler<Command, Response>>();
    }

    public static RouteGroupBuilder MapPutMeetup(this RouteGroupBuilder builder, string path)
    {
        builder.MapPut(path, async ([FromRoute] Guid meetupId, UpdateMeetupRequest request, [FromServices] IRequestHandler<Command, Result<Response>> handler) =>
        {
            var context = HandlerContextExtensions.Create(new Command(meetupId, request));
            var result = await handler.HandleAsync(context);

            IResult response = result switch
            {
                ErrorResult<Response> failure => TypedResults.Problem(failure.ToProblemDetails()),
                Success => TypedResults.NoContent(),
                _ => TypedResults.BadRequest("Failed to process request.")
            };
            return response;
        })
        .Accepts<UpdateMeetupRequest>("application/json");

        return builder;
    }
}
