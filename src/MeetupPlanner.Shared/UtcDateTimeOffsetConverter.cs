using System.Text.Json;
using System.Text.Json.Serialization;

namespace MeetupPlanner.Shared;

public sealed class UtcDateTimeOffsetConverter : JsonConverter<DateTimeOffset>
{
    private const string Format = "yyyy-MM-ddTHH:mm:ss.fffZ";

    public override DateTimeOffset Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (DateTimeOffset.TryParse(reader.GetString(), out var dto))
            return dto;
        throw new JsonException("Invalid DateTimeOffset format.");
    }

    public override void Write(Utf8JsonWriter writer, DateTimeOffset value, JsonSerializerOptions options)
    {
        // Always write as UTC with Z
        var dateTimeValue = value.UtcDateTime.ToString(Format);
        writer.WriteStringValue(value.UtcDateTime.ToString(Format));
    }
}
