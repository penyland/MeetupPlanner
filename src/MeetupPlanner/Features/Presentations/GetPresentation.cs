using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using Microsoft.EntityFrameworkCore;
using MeetupPlanner.Infrastructure;
using MeetupPlanner.Features.Common;

namespace MeetupPlanner.Features.Presentations;

public static class GetPresentation
{
    public sealed record Query(Guid PresentationId);

    public sealed record Response(PresentationDetailedResponse Presentation);

    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Query, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Query> context, CancellationToken cancellationToken)
        {
            try
            {
                var presentations = await dbContext.Presentations
                    .Include(p => p.PresentationSpeakers)
                    .ThenInclude(ps => ps.Speaker)
                    .AsNoTracking()
                    .Where(p => p.PresentationId == context.Request.PresentationId)
                    .FirstOrDefaultAsync(cancellationToken);

                if (presentations == null)
                {
                    return Result.Failure<Response>($"Presentation with ID {context.Request.PresentationId} not found.");
                }

                    var response = new PresentationDetailedResponse
                    {
                        PresentationId = presentations.PresentationId,
                        Title = presentations.Title,
                        Abstract = presentations.Abstract,
                        DurationMinutes = presentations.DurationMinutes,
                        RepoUrl = presentations.RepoUrl,
                        SlidesUrl = presentations.SlidesUrl,
                        Speakers = [.. presentations.PresentationSpeakers
                            .Select(ps => new SpeakerResponse
                            {
                                SpeakerId = ps.Speaker.SpeakerId,
                                FullName = ps.Speaker.FullName,
                            })]
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
