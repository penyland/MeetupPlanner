using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using Microsoft.EntityFrameworkCore;
using MeetupPlanner.Infrastructure;
using MeetupPlanner.Features.Common;

namespace MeetupPlanner.Features.Locations;

public static class GetLocation
{
    public sealed record Query(Guid LocationId);
    public sealed record Response(LocationDetailedDto Location);
    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Query, Response>
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
                var locationDto = new LocationDetailedDto
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

                return Result.Success(new Response(locationDto));
            }
            catch (Exception ex)
            {
                return Result.Failure<Response>(ex);
            }
        }
    }
}
