using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Features.Common;
using MeetupPlanner.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace MeetupPlanner.Features.Meetups;

public static class GetMeetups
{
    public sealed record Query(MeetupStatus Status);

    public record Response(IReadOnlyList<MeetupResponse> Meetups);

    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Query, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Query> context, CancellationToken cancellationToken = default)
        {
            try
            {
                var query = dbContext.Meetups
                    .Include(m => m.Location)
                    .Include(m => m.ScheduleSlots)
                    .ThenInclude(s => s.Presentation)
                    .ThenInclude(p => p.PresentationSpeakers)
                    .ThenInclude(ps => ps.Speaker)
                    .OrderBy(m => m.StartUtc)
                    .AsQueryable();

                if (context.Request.Status != MeetupStatus.All)
                {
                    query = query.Where(e => e.Status == context.Request.Status.ToString());
                }

                var meetups = await query
                    .AsNoTracking()
                    .ToListAsync(cancellationToken: cancellationToken);

                var getMeetupsResponse = meetups.Select(m => new MeetupResponse(
                m.MeetupId,
                m.Title,
                m.Description,
                m.StartUtc,
                m.EndUtc,
                new Rsvp(
                    m.TotalSpots ?? 0,
                    m.RsvpYesCount ?? 0,
                    m.RsvpNoCount ?? 0,
                    m.RsvpWaitlistCount ?? 0,
                    m.AttendanceCount ?? 0),
                new LocationResponse
                {
                    LocationId = m.Location.LocationId,
                    Name = m.Location.Name
                },
                [.. m.ScheduleSlots.Select(s => new PresentationResponse
                {
                    PresentationId = s.Presentation.PresentationId,
                    Title = s.Presentation.Title,
                    Speakers = [.. s.Presentation.PresentationSpeakers
                        .Select(ps => ps.Speaker)
                        .Select(s => new SpeakerResponse
                        {
                            SpeakerId = s.SpeakerId,
                            FullName = s.FullName
                        })]
                })]));

                return Result.Success<Response>(new Response([.. getMeetupsResponse]));
            }
            catch (Exception ex)
            {
                return Result.Failure<Response>(ex.Message);
            }
        }
    }
}
