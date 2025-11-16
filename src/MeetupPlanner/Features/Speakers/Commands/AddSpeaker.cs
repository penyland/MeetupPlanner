using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace MeetupPlanner.Features.Speakers.Commands;

public static class AddSpeaker
{
    public sealed record Command(SpeakerRequest Speaker);
    public sealed record Response(Guid SpeakerId);

    internal sealed class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            // Check for existing speaker with the same email
            // if a speaker with the same email exists, return a validation error
            if (!string.IsNullOrEmpty(context.Request.Speaker.Email))
            {
                var existingSpeaker = await dbContext.Speakers
                    .FirstOrDefaultAsync(s => s.Email == context.Request.Speaker.Email, cancellationToken);
                if (existingSpeaker != null)
                {
                    return Result.Failure<Response>($"A speaker with the email '{context.Request.Speaker.Email}' already exists.");
                }
            }

            var speaker = new Infrastructure.Models.Speaker
            {
                SpeakerId = Guid.NewGuid(),
                FullName = context.Request.Speaker.FullName,
                Company = context.Request.Speaker.Company,
                Email = context.Request.Speaker.Email,
                TwitterUrl = context.Request.Speaker.TwitterUrl,
                GitHubUrl = context.Request.Speaker.GitHubUrl,
                LinkedInUrl = context.Request.Speaker.LinkedInUrl,
                BlogUrl = context.Request.Speaker.BlogUrl,
                ThumbnailUrl = context.Request.Speaker.ThumbnailUrl
            };

            dbContext.Speakers.Add(speaker);
            await dbContext.SaveChangesAsync(cancellationToken);
            return new Response(speaker.SpeakerId);
        }
    }

    internal sealed class ValidatorHandler(IRequestHandler<Command, Result<Response>> innerHandler, IValidator<Command> validator) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            var validationResult = await validator.ValidateAsync(context.Request, cancellationToken);
            if (!validationResult.IsValid)
            {
                var errors = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
                return Result.Failure<Response>(errors);
            }
            return await innerHandler.HandleAsync(context, cancellationToken);
        }
    }

    internal sealed class AddSpeakerValidator : AbstractValidator<Command>
    {
        public AddSpeakerValidator()
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

    public record SpeakerRequest
    {
        public string FullName { get; set; }
        public string? Company { get; set; }
        public string? Email { get; set; }
        public string? TwitterUrl { get; set; }
        public string? GitHubUrl { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? BlogUrl { get; set; }
        public string? ThumbnailUrl { get; set; }
    }
}
