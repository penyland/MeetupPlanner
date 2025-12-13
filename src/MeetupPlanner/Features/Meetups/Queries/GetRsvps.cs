using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using Microsoft.EntityFrameworkCore;
using MeetupPlanner.Infrastructure;

namespace MeetupPlanner.Features.Meetups.Queries;

public static class GetRsvps
{
    public sealed record Query();

    public sealed record Response(List<RsvpResponse> Rsvps);

    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Query, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Query> context, CancellationToken cancellationToken)
        {
            try
            {
                var rsvps = await dbContext.Meetups
                    .AsNoTracking()
                    .Where(m => m.Status == MeetupStatus.Completed.ToString())
                    .OrderBy(m => m.StartUtc)
                    .Select(m => new RsvpResponse(
                        m.MeetupId,
                        m.StartUtc,
                        m.TotalSpots ?? 0,
                        m.RsvpYesCount ?? 0,
                        m.RsvpNoCount ?? 0,
                        m.RsvpWaitlistCount ?? 0,
                        m.AttendanceCount ?? 0)
                    )
                    .ToListAsync(cancellationToken);

                return Result.Success(new Response(rsvps));
            }
            catch (Exception ex)
            {
                return Result.Failure<Response>(ex);
            }
        }
    }
}
