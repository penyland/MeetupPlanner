using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;

namespace MeetupPlanner.Features.Meetups.Commands;

public static class UpdateMeetupAgenda
{
    public sealed record Command(Guid MeetupId, UpdateAgendaRequest AgendaRequest);

    public sealed record Response();

    public sealed record UpdateAgendaRequest(IReadOnlyList<Guid> PresentationIds = default!)
    {
        public UpdateAgendaRequest() : this(PresentationIds: []) { }
    }

    internal sealed class UpdateMeetupAgendaValidator : AbstractValidator<Command>
    {
        public UpdateMeetupAgendaValidator()
        {
            RuleFor(x => x.AgendaRequest.PresentationIds)
                .NotNull()
                .WithMessage("Presentation IDs must be provided.");
        }
    }

    internal sealed class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            var meetup = await dbContext.Meetups
                .Include(m => m.ScheduleSlots)
                .FirstOrDefaultAsync(m => m.MeetupId == context.Request.MeetupId, cancellationToken);

            if (meetup == null)
            {
                var notFoundError = Error.Validation(HttpStatusCode.NotFound.ToString(), $"Meetup with ID '{context.Request.MeetupId}' not found.");
                return Result.Failure<Response>(notFoundError);
            }

            var presentationIds = context.Request.AgendaRequest.PresentationIds.Distinct().ToList();

            // Verify all presentations exist
            if (presentationIds.Count > 0)
            {
                var presentations = await dbContext.Presentations
                    .AsNoTracking()
                    .Where(p => presentationIds.Contains(p.PresentationId))
                    .ToListAsync(cancellationToken);

                if (presentations.Count != presentationIds.Count)
                {
                    return Result.Failure<Response>("One or more selected presentations could not be found.");
                }
            }

            try
            {
                // Remove existing schedule slots for this meetup
                dbContext.ScheduleSlots.RemoveRange(meetup.ScheduleSlots);

                // Add new schedule slots based on the presentation IDs in order
                var presentations = presentationIds.Count > 0
                    ? await dbContext.Presentations
                        .AsNoTracking()
                        .Where(p => presentationIds.Contains(p.PresentationId))
                        .ToListAsync(cancellationToken)
                    : [];

                var newScheduleSlots = presentationIds.Select((presentationId, index) =>
                {
                    var presentation = presentations.Single(p => p.PresentationId == presentationId);
                    return new Infrastructure.Models.ScheduleSlot
                    {
                        SlotId = Guid.NewGuid(),
                        MeetupId = meetup.MeetupId,
                        SortOrder = index,
                        PresentationId = presentationId,
                        Title = presentation.Title,
                        StartUtc = null,
                        EndUtc = null
                    };
                }).ToList();

                dbContext.ScheduleSlots.AddRange(newScheduleSlots);
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex)
            {
                return Result.Failure<Response>($"An error occurred while updating the agenda for Meetup with ID '{context.Request.MeetupId}': {ex.Message}");
            }

            return Result.Success(new Response());
        }
    }

    public static void RegisterUpdateMeetupAgenda(this IServiceCollection services)
    {
        services.AddScoped<IValidator<Command>, UpdateMeetupAgendaValidator>();
        services.AddRequestHandler<Command, Result<Response>, Handler>()
            .Decorate<ValidatorHandler<Command, Response>>();
    }
}
