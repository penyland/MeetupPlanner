using System.ComponentModel;

namespace MeetupPlanner.Features.Common;

public record PresentationResponse
{
    [Description("The unique identifier of the presentation.")]
    public Guid PresentationId { get; init; }

    [Description("The title of the presentation.")]
    public string Title { get; init; }

    [Description("A brief summary or abstract of the presentation.")]
    public string Abstract { get; init; }

    [Description("List of speakers for the presentation.")]
    public IReadOnlyList<SpeakerResponse>? Speakers { get; init; }
}

public record PresentationDetailedResponse : PresentationResponse
{
    [Description("The duration of the presentation in minutes.")]
    public int DurationMinutes { get; init; } = 45;

    [Description("Link to the repository with the code referenced in the presentation, if any.")]
    public string? RepoUrl { get; init; }

    [Description("Link to the slides used in the presentation, if any.")]
    public string? SlidesUrl { get; init; }
}
