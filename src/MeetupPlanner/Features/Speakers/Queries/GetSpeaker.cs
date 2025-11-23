using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using Microsoft.EntityFrameworkCore;
using MeetupPlanner.Infrastructure;

namespace MeetupPlanner.Features.Speakers.Queries;

public static class GetSpeaker
{
    public sealed record Query(Guid SpeakerId);

    public sealed record Response(SpeakerDetailedResponse Speaker);

    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Query, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Query> context, CancellationToken cancellationToken = default)
        {
            try
            {
                var speaker = await dbContext.Speakers
                    .Include(s => s.Bios)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.SpeakerId == context.Request.SpeakerId, cancellationToken: cancellationToken);

                if (speaker == null)
                {
                    return Result.Failure<Response>($"Speaker with ID {context.Request.SpeakerId} not found.");
                }

                var response = new SpeakerDetailedResponse
                {
                    SpeakerId = speaker.SpeakerId,
                    FullName = speaker.FullName,
                    Company = speaker.Company,
                    Email = speaker.Email,
                    TwitterUrl = speaker.TwitterUrl,
                    GitHubUrl = speaker.GitHubUrl,
                    LinkedInUrl = speaker.LinkedInUrl,
                    Bio = speaker.Bios.FirstOrDefault(b => b.IsPrimary)?.Bio,
                    BlogUrl = speaker.BlogUrl,
                    ThumbnailUrl = speaker.ThumbnailUrl
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
