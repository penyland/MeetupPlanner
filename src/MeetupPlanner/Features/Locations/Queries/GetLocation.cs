using Infinity.Toolkit;
using Infinity.Toolkit.AspNetCore;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Infrastructure;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace MeetupPlanner.Features.Locations.Queries;

public static class GetLocation
{
    public sealed record Query(Guid LocationId);
    public sealed record Response(LocationDetailedResponse Location);
    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Query, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Query> context, CancellationToken cancellationToken = default)
        {
            try
            {
                var location = await dbContext.Locations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.LocationId == context.Request.LocationId, cancellationToken: cancellationToken);

                if (location == null)
                {
                    return Result.Failure<Response>($"Location with ID {context.Request.LocationId} not found.");
                }

                var locationResponse = new LocationDetailedResponse
                {
                    LocationId = location.LocationId,
                    Name = location.Name,
                    Street = location.Street,
                    City = location.City,
                    PostalCode = location.PostalCode,
                    Country = location.Country,
                    Description = location.Description,
                    MaxCapacity = location.MaxCapacity,
                    IsActive = location.IsActive,
                };

                return Result.Success(new Response(locationResponse));
            }
            catch (Exception ex)
            {
                return Result.Failure<Response>(ex);
            }
        }
    }

    public static void MapGetLocation(this RouteGroupBuilder builder, string path)
    {
        builder.MapGetRequestHandlerWithResult<Query, Response, LocationDetailedResponse>(path, map => map.Location);
    }
}
