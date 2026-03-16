using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;

namespace MeetupPlanner.Features.Presentations.Commands;

public static class UpdatePresentation
{
    public sealed record Command(Guid PresentationId, UpdatePresentationRequest PresentationRequest);

    public sealed record Response();

    public sealed record UpdatePresentationRequest(
        string Title = "",
        string Abstract = "",
        IReadOnlyList<Guid> SpeakerIds = default!)
    {
        public UpdatePresentationRequest() : this(Title: "", Abstract: "", SpeakerIds: []) { }
    }

    internal sealed class UpdatePresentationValidator : AbstractValidator<Command>
    {
        public UpdatePresentationValidator()
        {
            RuleFor(x => x.PresentationRequest.Title)
                .NotEmpty()
                .WithMessage("Title is required.");

            RuleFor(x => x.PresentationRequest.Abstract)
                .NotEmpty()
                .WithMessage("Abstract is required.");

            RuleFor(x => x.PresentationRequest.SpeakerIds)
                .NotEmpty()
                .WithMessage("At least one speaker must be assigned.");
        }
    }

    internal sealed class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            var presentation = await dbContext.Presentations
                .Include(p => p.PresentationSpeakers)
                .FirstOrDefaultAsync(p => p.PresentationId == context.Request.PresentationId, cancellationToken);

            if (presentation == null)
            {
                var notFoundError = Error.Validation(HttpStatusCode.NotFound.ToString(), $"Presentation with ID '{context.Request.PresentationId}' not found.");
                return Result.Failure<Response>(notFoundError);
            }

            var speakerIds = context.Request.PresentationRequest.SpeakerIds.Distinct().ToList();

            // Verify all speakers exist
            var speakers = await dbContext.Speakers
                .AsNoTracking()
                .Where(s => speakerIds.Contains(s.SpeakerId))
                .ToListAsync(cancellationToken);

            if (speakers.Count != speakerIds.Count)
            {
                return Result.Failure<Response>("One or more selected speakers could not be found.");
            }

            try
            {
                presentation.Title = context.Request.PresentationRequest.Title;
                presentation.Abstract = context.Request.PresentationRequest.Abstract;

                // Remove existing presentation speakers
                dbContext.PresentationSpeakers.RemoveRange(presentation.PresentationSpeakers);

                // Add new presentation speakers
                var newPresentationSpeakers = speakerIds.Select(speakerId =>
                    new Infrastructure.Models.PresentationSpeakerEntity
                    {
                        PresentationId = presentation.PresentationId,
                        SpeakerId = speakerId
                    }).ToList();

                dbContext.PresentationSpeakers.AddRange(newPresentationSpeakers);
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex)
            {
                return Result.Failure<Response>($"An error occurred while updating the presentation: {ex.Message}");
            }

            return Result.Success(new Response());
        }
    }

    public static void RegisterUpdatePresentation(this IServiceCollection services)
    {
        services.AddScoped<IValidator<Command>, UpdatePresentationValidator>();
        services.AddRequestHandler<Command, Result<Response>, Handler>()
            .Decorate<ValidatorHandler<Command, Response>>();
    }
}
