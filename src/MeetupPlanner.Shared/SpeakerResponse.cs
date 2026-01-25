namespace MeetupPlanner.Shared;

public record SpeakerResponse
{
    public Guid SpeakerId { get; init; }
    public string FullName { get; init; }
    public string? ThumbnailUrl { get; init; }
}


public record SpeakerDetailedResponse
{
    public Guid SpeakerId { get; init; }
    public string FullName { get; init; }
    public string? Company { get; init; }
    public string? Email { get; init; }
    public string? TwitterUrl { get; init; }
    public string? GitHubUrl { get; init; }
    public string? LinkedInUrl { get; init; }
    public string? BlogUrl { get; init; }
    public string? ThumbnailUrl { get; init; }
    public string? Bio { get; init; }
}

public record SpeakerRequest
{
    public string FullName { get; set; }
    public string? Company { get; set; }
    public string? Email { get; set; }
    public string? TwitterUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? BlogUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
}
