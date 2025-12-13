namespace MeetupPlanner.Shared;

public sealed record RsvpRequest
(
    int? TotalSpots,
    int? RsvpYesCount,
    int? RsvpNoCount,
    int? RsvpWaitlistCount,
    int? AttendanceCount
);

public sealed record RsvpResponse
(
    Guid MeetupId,
    DateTimeOffset StartUtc,
    int TotalSpots,
    int RsvpYesCount,
    int RsvpNoCount,
    int RsvpWaitlistCount,
    int AttendanceCount
);
