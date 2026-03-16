using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;

namespace MeetupPlanner.Features.Presentations.Commands;

public static class DeletePresentation
{
    public sealed record Command(Guid PresentationId);

    public sealed record Response();

    internal sealed class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            var presentation = await dbContext.Presentations.FindAsync([context.Request.PresentationId], cancellationToken);

            if (presentation == null)
            {
                var notFoundError = Error.Validation(HttpStatusCode.NotFound.ToString(), $"Presentation with ID '{context.Request.PresentationId}' not found.");
                return Result.Failure<Response>(notFoundError);
            }

            try
            {
                // Remove all schedule slots referencing this presentation
                var scheduleSlots = await dbContext.ScheduleSlots
                    .Where(ss => ss.PresentationId == context.Request.PresentationId)
                    .ToListAsync(cancellationToken);

                if (scheduleSlots.Count > 0)
                {
                    dbContext.ScheduleSlots.RemoveRange(scheduleSlots);
                }

                // Remove the presentation
                dbContext.Presentations.Remove(presentation);
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex)
            {
                return Result.Failure<Response>($"An error occurred while deleting the presentation: {ex.Message}");
            }

            return Result.Success(new Response());
        }
    }

    public static void RegisterDeletePresentation(this IServiceCollection services)
    {
        services.AddRequestHandler<Command, Result<Response>, Handler>();
    }
}
