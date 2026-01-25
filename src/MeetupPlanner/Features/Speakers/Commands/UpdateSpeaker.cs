using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace MeetupPlanner.Features.Speakers.Commands;

public static class UpdateSpeaker
{
    public sealed record Command(Guid SpeakerId, SpeakerRequest Speaker);
    public sealed record Response(Guid SpeakerId);

    internal sealed class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            // Find existing speaker by ID
            var speaker = await dbContext.Speakers
                .FirstOrDefaultAsync(s => s.SpeakerId == context.Request.SpeakerId, cancellationToken);

            if (speaker == null)
            {
                return Result.Failure<Response>($"Speaker with ID '{context.Request.SpeakerId}' not found.");
            }

            // Update properties directly on the tracked entity
            speaker.FullName = context.Request.Speaker.FullName;
            speaker.Company = context.Request.Speaker.Company;
            speaker.Email = context.Request.Speaker.Email;
            speaker.TwitterUrl = context.Request.Speaker.TwitterUrl;
            speaker.GitHubUrl = context.Request.Speaker.GitHubUrl;
            speaker.LinkedInUrl = context.Request.Speaker.LinkedInUrl;
            speaker.BlogUrl = context.Request.Speaker.BlogUrl;
            speaker.ThumbnailUrl = context.Request.Speaker.ThumbnailUrl;
            // EF Core will automatically set UpdatedUtc and UpdatedBy if configured

            await dbContext.SaveChangesAsync(cancellationToken);
            return new Response(speaker.SpeakerId);
        }
    }

    internal sealed class UpdateSpeakerValidator : AbstractValidator<Command>
    {
        public UpdateSpeakerValidator()
        {
            RuleFor(x => x.Speaker.FullName)
                .NotEmpty().WithMessage("FullName is required.")
                .MaximumLength(200).WithMessage("FullName cannot exceed 200 characters.");

            RuleFor(x => x.Speaker.Company)
                .MaximumLength(200).WithMessage("Company cannot exceed 200 characters.")
                .When(x => !string.IsNullOrEmpty(x.Speaker.Company));

            RuleFor(x => x.Speaker.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("Email must be a valid email address.");

            RuleFor(x => x.Speaker.TwitterUrl)
                .Must(uri => Uri.IsWellFormedUriString(uri, UriKind.Absolute))
                .WithMessage("TwitterUrl must be a valid URL.")
                .When(x => !string.IsNullOrEmpty(x.Speaker.TwitterUrl));

            RuleFor(x => x.Speaker.GitHubUrl)
                .Must(uri => Uri.IsWellFormedUriString(uri, UriKind.Absolute))
                .WithMessage("GitHubUrl must be a valid URL.")
                .When(x => !string.IsNullOrEmpty(x.Speaker.GitHubUrl));

            RuleFor(x => x.Speaker.LinkedInUrl)
                .Must(uri => Uri.IsWellFormedUriString(uri, UriKind.Absolute))
                .WithMessage("LinkedInUrl must be a valid URL.")
                .When(x => !string.IsNullOrEmpty(x.Speaker.LinkedInUrl));

            RuleFor(x => x.Speaker.BlogUrl)
                .Must(uri => Uri.IsWellFormedUriString(uri, UriKind.Absolute))
                .WithMessage("BlogUrl must be a valid URL.")
                .When(x => !string.IsNullOrEmpty(x.Speaker.BlogUrl));

            RuleFor(x => x.Speaker.ThumbnailUrl)
                .Must(uri => Uri.IsWellFormedUriString(uri, UriKind.Absolute))
                .WithMessage("ThumbnailUrl must be a valid URL.")
                .When(x => !string.IsNullOrEmpty(x.Speaker.ThumbnailUrl));
        }
    }
}
