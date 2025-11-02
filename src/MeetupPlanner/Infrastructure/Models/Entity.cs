using System.Text.Json.Serialization;

namespace MeetupPlanner.Infrastructure.Models;

public class Entity
{
    [JsonIgnore]
    public DateTimeOffset CreatedUtc { get; set; } = DateTimeOffset.UtcNow;

    [JsonIgnore]
    public string CreatedBy { get; set; }

    [JsonIgnore]
    public DateTimeOffset UpdatedUtc { get; set; } = DateTimeOffset.UtcNow;

    [JsonIgnore]
    public string UpdatedBy { get; set; }
}
