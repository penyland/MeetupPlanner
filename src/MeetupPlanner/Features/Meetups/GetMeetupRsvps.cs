using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using Microsoft.EntityFrameworkCore;
using MeetupPlanner.Infrastructure;

namespace MeetupPlanner.Features.Meetups;

public static class GetMeetupRsvps
{
    public sealed record Query(Guid MeetupId);

    public sealed record Response(Rsvp Rsvp);

    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Query, Response>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Query> context, CancellationToken cancellationToken)
        {
            try
            {
                var meetup = await dbContext.Meetups
                    .AsNoTracking()
                    .Select(m => new
                    {
                        m.MeetupId,
                        m.TotalSpots,
                        m.RsvpYesCount,
                        m.RsvpNoCount,
                        m.RsvpWaitlistCount,
                        m.AttendanceCount
                    })
                    .FirstOrDefaultAsync(m => m.MeetupId == context.Request.MeetupId, cancellationToken: cancellationToken);

                if (meetup == null)
                {
                    return Result.Failure<Response>(
                        new Error("400", "No meetup found for the specified ID."));
                }

                var rsvp = new Rsvp(
                    meetup.TotalSpots ?? 0,
                    meetup.RsvpYesCount ?? 0,
                    meetup.RsvpNoCount ?? 0,
                    meetup.RsvpWaitlistCount ?? 0,
                    meetup.AttendanceCount ?? 0);

                return Result.Success(new Response(rsvp));
            }
            catch (Exception ex)
            {
                return Result.Failure<Response>(ex);
            }
        }
    }
}
