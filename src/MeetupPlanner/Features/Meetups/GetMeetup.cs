using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using Microsoft.EntityFrameworkCore;
using MeetupPlanner.Features.Common;
using MeetupPlanner.Infrastructure;

namespace MeetupPlanner.Features.Meetups;

public static class GetMeetup
{
    public sealed record Query(Guid MeetupId);

    public sealed record Response(MeetupResponse Meetup);

    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Query, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Query> context, CancellationToken cancellationToken)
        {
            try
            {
                var meetup = await dbContext.Meetups
                    .Include(m => m.Location)
                    .Include(m => m.ScheduleSlots)
                    .ThenInclude(s => s.Presentation)
                    .ThenInclude(p => p.PresentationSpeakers)
                    .ThenInclude(ps => ps.Speaker)
                    .ThenInclude(sb => sb.Bios)
                    .AsNoTracking()
                    .Where(m => m.MeetupId == context.Request.MeetupId)
                .Select(m => new MeetupResponse(m.MeetupId,
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
                            Name = m.Location.Name,
                            LocationId = m.Location.LocationId,
                            IsActive = m.Location.IsActive
                        },
                        m.ScheduleSlots
                            .Where(slot => slot.Presentation != null)
                            .Select(slot => slot.Presentation)
                            .Select(p => new PresentationResponse
                            {
                                PresentationId = p.PresentationId,
                                Title = p.Title,
                                Abstract = p.Abstract,
                                Speakers = p.PresentationSpeakers
                                    .Select(ps => ps.Speaker)
                                    .Select(s => new SpeakerResponse
                                    {
                                        SpeakerId = s.SpeakerId,
                                        FullName = s.FullName,
                                        ThumbnailUrl = s.ThumbnailUrl
                                    }).ToList()
                            }).ToList()))
                    .FirstOrDefaultAsync(cancellationToken);

                return meetup == null ? Result.Failure<Response>("No meetup found") : Result.Success(new Response(meetup));
            }
            catch (Exception ex)
            {
                return Result.Failure<Response>(ex);
            }
        }
    }
}
