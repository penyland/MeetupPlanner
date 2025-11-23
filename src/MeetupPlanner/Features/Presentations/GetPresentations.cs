using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using Microsoft.EntityFrameworkCore;
using MeetupPlanner.Infrastructure;

namespace MeetupPlanner.Features.Presentations;

public static class GetPresentations
{
    public sealed record Query();

    public sealed record Response(IReadOnlyList<PresentationResponse> Presentations);

    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(CancellationToken cancellationToken)
        {
            try
            {
                var presentations = await dbContext.Presentations
                    .Include(p => p.PresentationSpeakers)
                    .ThenInclude(ps => ps.Speaker)
                    .AsNoTracking()
                    .ToListAsync(cancellationToken: cancellationToken);
                var response = presentations.Select(p => new PresentationResponse
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
                });

                return Result.Success(new Response([.. response]));
            }
            catch (Exception ex)
            {
                return Result.Failure<Response>(ex);
            }
        }
    }
}
