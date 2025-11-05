using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MeetupPlanner.Features.Meetups.Commands;

public static class UpdateMeetupRsvps
{
    public sealed record Command(Guid MeetupId, int RsvpYesCount, int RsvpNoCount, int RsvpWaitlistCount, int AttendanceCount);

    public sealed record Response();

    internal sealed class UpdateMeetupRsvpsValidator : AbstractValidator<Command>
    {
        public UpdateMeetupRsvpsValidator()
        {
            RuleFor(x => x.MeetupId).NotEmpty();
            RuleFor(x => x.RsvpYesCount)
                .GreaterThanOrEqualTo(0)
                .LessThanOrEqualTo(x => x.AttendanceCount);
            RuleFor(x => x.RsvpNoCount).GreaterThanOrEqualTo(0);
            RuleFor(x => x.RsvpWaitlistCount).GreaterThanOrEqualTo(0);
            RuleFor(x => x.AttendanceCount).GreaterThanOrEqualTo(0);
        }
    }

    internal sealed class Handler(MeetupPlannerDbContext meetupPlannerDbContext) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            var meetup = await meetupPlannerDbContext.Meetups.FindAsync([context.Request.MeetupId], cancellationToken);

            if (meetup == null)
            {
                return Result.Failure<Response>($"Meetup with ID '{context.Request.MeetupId}' not found.");
            }

            meetup.RsvpYesCount = context.Request.RsvpYesCount;
            meetup.RsvpNoCount = context.Request.RsvpNoCount;
            meetup.RsvpWaitlistCount = context.Request.RsvpWaitlistCount;
            meetup.AttendanceCount = context.Request.AttendanceCount;

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

    internal sealed class Validator(IRequestHandler<Command, Result<Response>> innerHandler, IValidator<UpdateMeetupRsvps.Command> validator) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            var validationResult = await validator.ValidateAsync(context.Request, cancellationToken);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => new ValidationError(e.PropertyName, e.ErrorMessage)).ToList();
                return Result.Failure<Response>(errors);
            }

            return await innerHandler.HandleAsync(context, cancellationToken);
        }
    }

    public static void RegisterUpdateMeetupRsvps(this IServiceCollection services)
    {
        services.AddScoped<IValidator<Command>, UpdateMeetupRsvpsValidator>();
        services.AddRequestHandler<Command, Result<Response>, Handler>()
            .Decorate<Validator>();
    }
}
