using Infinity.Toolkit;
using Infinity.Toolkit.AspNetCore;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Features.Common;
using MeetupPlanner.Infrastructure;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace MeetupPlanner.Features.Locations.Queries;

public static class GetLocations
{
    public sealed record Response(IReadOnlyList<LocationResponse> Locations);

    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Result<Response>>
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

    public static void MapGetLocations(this RouteGroupBuilder builder, string path)
    {
        builder.MapGetRequestHandlerWithResult<Response, IReadOnlyList<LocationResponse>>(path, map => map.Locations);
    }
}
