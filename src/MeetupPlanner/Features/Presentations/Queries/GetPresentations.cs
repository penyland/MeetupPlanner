using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using Microsoft.EntityFrameworkCore;
using MeetupPlanner.Infrastructure;

namespace MeetupPlanner.Features.Presentations.Queries;

public static class GetPresentations
{
    public sealed record Query(PresentationsQueryParameters QueryParameters);

    public sealed record Response(IReadOnlyList<PresentationResponse> Presentations);

    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Query, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IRequestHandlerContext<Query> context, CancellationToken cancellationToken = default)
        {
            try
            {
                var query = dbContext.Presentations
                    .Include(p => p.PresentationSpeakers)
                    .ThenInclude(ps => ps.Speaker)
                    .AsQueryable();

                var ascending = context.Request.QueryParameters.SortOrder != SortOrder.Descending;
                query = context.Request.QueryParameters.OrderBy switch
                {
                    OrderBy.Created => ascending ? query.OrderBy(p => p.CreatedUtc) : query.OrderByDescending(p => p.CreatedUtc),
                    _ => ascending ? query.OrderBy(p => p.Title) : query.OrderByDescending(p => p.Title),
                };

                query = context.Request.QueryParameters.SpeakerId.HasValue
                    ? query.Where(p => p.PresentationSpeakers.Any(ps => ps.SpeakerId == context.Request.QueryParameters.SpeakerId.Value))
                    : query;

                var presentations = await query
                    .AsNoTracking()
                    .ToListAsync(cancellationToken: cancellationToken);

                var responseList = presentations.Select(p => new PresentationResponse
                {
                    PresentationId = p.PresentationId,
                    Title = p.Title,
                    Abstract = p.Abstract,
                    Speakers = [.. p.PresentationSpeakers
                        .Select(ps => new SpeakerResponse
                        {
                            SpeakerId = ps.Speaker.SpeakerId,
                            FullName = ps.Speaker.FullName,
                        })]
                }).ToList();

                return Result.Success(new Response(responseList));
            }
            catch (Exception ex)
            {
                return Result.Failure<Response>(ex);
            }
        }
    }
}
