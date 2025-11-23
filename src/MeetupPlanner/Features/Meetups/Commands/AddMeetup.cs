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

public static class AddMeetup
{
    public sealed record Command(MeetupRequest Meetup);
    public sealed record Response(Guid MeetupId);

    internal sealed class AddMeetupValidator : AbstractValidator<Command>
    {
        public AddMeetupValidator()
        {
            RuleFor(x => x.Meetup.Title)
                .NotEmpty().WithMessage("Title is required.")
                .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.");

            RuleFor(x => x.Meetup.Description)
                .NotEmpty().WithMessage("Description is required.")
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.");

            RuleFor(x => x.Meetup.StartUtc)
                .NotEmpty().WithMessage("StartUtc is required.")
                .Must(date => date > DateTime.UtcNow).WithMessage("StartUtc must be in the future.");

            RuleFor(x => x.Meetup.EndUtc)
                .NotEmpty().WithMessage("EndUtc is required.")
                .GreaterThan(x => x.Meetup.StartUtc).WithMessage("EndUtc must be after StartUtc.");

            RuleFor(x => x.Meetup.TotalSpots)
                .GreaterThan(0).WithMessage("TotalSpots must be greater than zero.");

            RuleFor(x => x.Meetup.Status)
                .NotEmpty().WithMessage("Status is required.")
                .IsInEnum().WithMessage("Status must be a valid enum value.");

            RuleFor(x => x.Meetup.LocationName)
                .NotEmpty().WithMessage("Location is required.")
                .MaximumLength(300).WithMessage("Location cannot exceed 300 characters.");
        }
    }

    internal sealed class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            // Verify location exists
            var location = await dbContext
                .Locations
                .AsNoTracking()
                .SingleOrDefaultAsync(l => l.Name == context.Request.Meetup.LocationName, cancellationToken);

            if (location == null)
            {
                return Result.Failure<Response>($"Location '{context.Request.Meetup.LocationName}' not found. Add location before adding a meetup.");
            }

            var meetup = new Infrastructure.Models.Meetup
            {
                MeetupId = context.Request.Meetup.MeetupId ?? Guid.NewGuid(),
                Title = context.Request.Meetup.Title,
                Description = context.Request.Meetup.Description,
                StartUtc = context.Request.Meetup.StartUtc,
                EndUtc = context.Request.Meetup.EndUtc,
                TotalSpots = context.Request.Meetup.TotalSpots,
                AttendanceCount = context.Request.Meetup.AttendanceCount,
                RsvpYesCount = context.Request.Meetup.RsvpYesCount,
                RsvpNoCount = context.Request.Meetup.RsvpNoCount,
                RsvpWaitlistCount = context.Request.Meetup.RsvpWaitlistCount,
                Status = context.Request.Meetup.Status.ToString(),
                LocationId = location.LocationId,
            };

            try
            {
                dbContext.Meetups.Add(meetup);
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex)
            {
                return Result.Failure<Response>(ex);
            }

            return Result.Success(new Response(meetup.MeetupId));
        }
    }

    internal sealed class ValidatorHandler(IRequestHandler<Command, Result<Response>> innerHandler, IValidator<AddMeetup.Command> validator) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            var validationResult = await validator.ValidateAsync(context.Request, cancellationToken);

            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => new ValidationError(e.PropertyName, e.ErrorMessage)).ToList();
                return Result.Failure<Response>("Validation failed for AddMeetup.", errors);
            }

            return await innerHandler.HandleAsync(context, cancellationToken);
        }
    }

    public record MeetupRequest
    {
        public Guid? MeetupId { get; init; } = Guid.NewGuid();

        public string Title { get; init; } = string.Empty;

        public string Description { get; init; } = string.Empty;

        public DateTimeOffset StartUtc { get; init; }

        public DateTimeOffset EndUtc { get; init; }

        public int TotalSpots { get; init; } = 0;

        public int? AttendanceCount { get; init; } = 0;

        public int? RsvpYesCount { get; init; } = 0;

        public int? RsvpNoCount { get; init; } = 0;

        public int? RsvpWaitlistCount { get; init; } = 0;

        public MeetupStatus Status { get; init; } = MeetupStatus.Scheduled;

        public string LocationName { get; init; } = string.Empty;

    }

    public static void RegisterAddMeetup(this IServiceCollection services)
    {
        services.AddScoped<IValidator<AddMeetup.Command>, AddMeetup.AddMeetupValidator>();
        services.AddRequestHandler<AddMeetup.Command, Result<AddMeetup.Response>, AddMeetup.Handler>()
            .Decorate<AddMeetup.ValidatorHandler>();
    }

    public static RouteGroupBuilder MapPostMeetup(this RouteGroupBuilder builder, string path)
    {
        //builder.MapPostRequestHandlerWithResult<Command, Response, Guid>(path, map => map.MeetupId);

        builder.MapPost(path, async (MeetupRequest request, [FromServices] IRequestHandler<Command, Result<Response>> handler) =>
        {
            var context = HandlerContextExtensions.Create<Command>(new(request));
            var result = await handler.HandleAsync(context);

            IResult response = result switch
            {
                ErrorResult<Response> failure => TypedResults.Problem(failure.ToProblemDetails()),
                Success => TypedResults.Created($"/{path}/{result.Value.MeetupId}", result.Value.MeetupId),
                _ => TypedResults.BadRequest("Failed to process request.")
            };
            return response;
        })
        .Accepts<MeetupRequest>("application/json");

        return builder;
    }
}
