using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using Microsoft.EntityFrameworkCore;
using MeetupPlanner.Infrastructure;
using MeetupPlanner.Features.Common;

namespace MeetupPlanner.Features.Locations;

public static class GetLocations
{
    public sealed record Response(IReadOnlyList<LocationResponse> Locations);

    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Response>
    {
        public async Task<Result<Response>> HandleAsync(CancellationToken cancellationToken)
        {
            try
            {
                var locations = await dbContext.Locations.AsNoTracking().ToListAsync(cancellationToken: cancellationToken);

                var locationDtos = locations.Select(l => new LocationResponse
                {
                    LocationId = l.LocationId,
                    Name = l.Name,
                    MaxCapacity = l.MaxCapacity,
                    IsActive = l.IsActive,
                });

                return Result.Success(new Response([.. locationDtos]));
            }
            catch (Exception ex)
            {
                return Result.Failure<Response>(ex);
            }
        }
    }
}
