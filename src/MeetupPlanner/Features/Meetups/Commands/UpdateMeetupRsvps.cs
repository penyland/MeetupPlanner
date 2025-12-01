using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;

namespace MeetupPlanner.Features.Meetups.Commands;

public static class UpdateMeetupRsvps
{
    public sealed record Command(Guid MeetupId, RsvpRequest RsvpRequest);

    public sealed record Response();

    internal sealed class UpdateMeetupRsvpsValidator : AbstractValidator<Command>
    {
        public UpdateMeetupRsvpsValidator()
        {
            RuleFor(x => x.RsvpRequest.RsvpYesCount)
                .GreaterThanOrEqualTo(0)
                .LessThanOrEqualTo(x => x.RsvpRequest.TotalSpots);
            RuleFor(x => x.RsvpRequest.RsvpNoCount)
                .GreaterThanOrEqualTo(0)
                .LessThanOrEqualTo(x => x.RsvpRequest.TotalSpots);
            RuleFor(x => x.RsvpRequest.RsvpWaitlistCount)
                .GreaterThanOrEqualTo(0)
                .LessThanOrEqualTo(x => x.RsvpRequest.TotalSpots);
            RuleFor(x => x.RsvpRequest.AttendanceCount)
                .GreaterThanOrEqualTo(0)
                .LessThanOrEqualTo(x => x.RsvpRequest.TotalSpots);
        }
    }

    internal sealed class Handler(MeetupPlannerDbContext meetupPlannerDbContext) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            var meetup = await meetupPlannerDbContext.Meetups.FindAsync([context.Request.MeetupId], cancellationToken);

            if (meetup == null)
            {
                var notFoundError = Error.Validation(HttpStatusCode.NotFound.ToString(), $"Meetup with ID '{context.Request.MeetupId}' not found.");
                return Result.Failure<Response>(notFoundError);
            }


            meetup.TotalSpots = context.Request.RsvpRequest.TotalSpots ?? meetup.TotalSpots;
            meetup.RsvpYesCount = context.Request.RsvpRequest.RsvpYesCount ?? meetup.RsvpYesCount;
            meetup.RsvpNoCount = context.Request.RsvpRequest.RsvpNoCount ?? meetup.RsvpNoCount;
            meetup.RsvpWaitlistCount = context.Request.RsvpRequest.RsvpWaitlistCount ?? meetup.RsvpWaitlistCount;
            meetup.AttendanceCount = context.Request.RsvpRequest.AttendanceCount ?? meetup.AttendanceCount;

            try
            {
                await meetupPlannerDbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex)
            {
                return Result.Failure<Response>($"An error occurred while updating RSVP counts for Meetup with ID '{context.Request.MeetupId}': {ex.Message}");
            }

            return Result.Success(new Response());
        }
    }

    public static void RegisterUpdateMeetupRsvps(this IServiceCollection services)
    {
        services.AddScoped<IValidator<Command>, UpdateMeetupRsvpsValidator>();
        services.AddRequestHandler<Command, Result<Response>, Handler>()
            .Decorate<ValidatorHandler<Command, Response>>();
    }
}
