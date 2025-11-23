using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using Microsoft.EntityFrameworkCore;
using MeetupPlanner.Infrastructure;

namespace MeetupPlanner.Features.Meetups.Queries;

public static class GetMeetupLocation
{
    public sealed record Query(Guid MeetupId);

    public sealed record Response(LocationDetailedResponse Location);

    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Query, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Query> context, CancellationToken cancellationToken)
        {
            try
            {
                var meetup = await dbContext.Meetups
                    .Include(m => m.Location)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m => m.MeetupId == context.Request.MeetupId, cancellationToken: cancellationToken);

                if (meetup == null || meetup.Location == null)
                {
                    return Result.Failure<Response>("No meetup found");
                }

                var location = meetup.Location;
                var response = new LocationDetailedResponse
                {
                    LocationId = location.LocationId,
                    Name = location.Name,
                    Street = location.Street,
                    City = location.City,
                    PostalCode = location.PostalCode,
                    Country = location.Country,
                    Description = location.Description,
                    MaxCapacity = location.MaxCapacity,
                    IsActive = location.IsActive
                };

                return Result.Success(new Response(response));
            }
            catch (Exception ex)
            {
                return Result.Failure<Response>(ex);
            }
        }
    }
}
