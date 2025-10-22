namespace MeetupPlanner.Features.Common;

public record LocationResponse
{
    public Guid LocationId { get; init; }
    public string Name { get; init; }
    public int MaxCapacity { get; init; } = 50;
    public bool IsActive { get; init; } = true;
}

public record LocationDetailedResponse : LocationResponse
{
    public string? Street { get; init; }
    public string? City { get; init; }
    public string? PostalCode { get; init; }
    public string? Country { get; init; }
    public string? Description { get; init; }
}
