using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using Microsoft.EntityFrameworkCore;
using MeetupPlanner.Infrastructure;
using MeetupPlanner.Features.Common;

namespace MeetupPlanner.Features.Locations;

public static class AddLocation
{
    public sealed record Command(LocationRequest Location);

    public sealed record Response(LocationDetailedResponse Location);

    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Command, Response>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            try
            {
                // Validate input
                var newLocation = new Infrastructure.Models.Location
                {
                    LocationId = Guid.NewGuid(),
                    Name = context.Request.Location.Name,
                    Street = context.Request.Location.Street,
                    City = context.Request.Location.City,
                    PostalCode = context.Request.Location.PostalCode,
                    Country = context.Request.Location.Country,
                    Description = context.Request.Location.Description,
                    MaxCapacity = context.Request.Location.MaxCapacity,
                    IsActive = context.Request.Location.IsActive,
                };

                dbContext.Locations.Add(newLocation);
                await dbContext.SaveChangesAsync(cancellationToken);

                var locationDto = new LocationDetailedResponse
                {
                    LocationId = newLocation.LocationId,
                    Name = newLocation.Name,
                    Street = newLocation.Street,
                    City = newLocation.City,
                    PostalCode = newLocation.PostalCode,
                    Country = newLocation.Country,
                    Description = newLocation.Description,
                    MaxCapacity = newLocation.MaxCapacity,
                    IsActive = newLocation.IsActive,
                };

                return Result.Success(new Response(locationDto));
            }
            catch (Exception ex)
            {
                return Result.Failure<Response>(ex);
            }
        }
    }

    public record LocationRequest
    {
        public string Name { get; init; } = string.Empty;
        public string Street { get; init; } = string.Empty;
        public string City { get; init; } = string.Empty;
        public string PostalCode { get; init; } = string.Empty;
        public string Country { get; init; } = string.Empty;
        public string Description { get; init; } = string.Empty;
        public int MaxCapacity { get; init; }
        public bool IsActive { get; init; }
    }

    public class Endpoint
    {

    }
}
