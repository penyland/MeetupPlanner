using MeetupPlanner.Features.Common;

namespace MeetupPlanner.Features.Meetups;

public record MeetupResponse(
    Guid MeetupId,
    string Title,
    string Description,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc,
    Rsvp Rsvp,
    LocationResponse Location,
    IReadOnlyList<PresentationResponse>? Presentations = null
);

public record Rsvp(
    int TotalSpots,
    int RsvpYesCount,
    int RsvpNoCount,
    int RsvpWaitlistCount,
    int AttendanceCount
    );
