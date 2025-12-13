using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Infrastructure;
using MeetupPlanner.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetupPlanner.Features.Speakers.Commands;

public static partial class AddSpeakerBiography
{
    public sealed record Command(Guid SpeakerId, string Biography, bool IsPrimary);

    public sealed record Response(Guid SpeakerBiographyId);

    internal sealed class AddSpeakerBiographyValidator : AbstractValidator<Command>
    {
        public AddSpeakerBiographyValidator()
        {
            RuleFor(x => x.SpeakerId)
                .NotEmpty().WithMessage("SpeakerId is required.")
                .Custom((guid, context) =>
                {
                    if (!Guid.TryParse(guid.ToString(), out _))
                    {
                        context.AddFailure("SpeakerId is not a valid Guid.");
                    }
                });
                
            RuleFor(x => x.Biography)
                .NotEmpty().WithMessage("Biography is required.")
                .MaximumLength(5000).WithMessage("Biography cannot exceed 5000 characters.");
        }
    }

    internal sealed class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            if (context.Request.SpeakerId == Guid.Empty)
            {
                return Result.Failure<Response>("SpeakerId is not a Guid.");
            }

            // Validate that the speaker exists
            var speakerExists = await dbContext.Speakers
                .Where(s => s.SpeakerId == context.Request.SpeakerId)
                .FirstOrDefaultAsync(cancellationToken: cancellationToken);

            if (speakerExists == null) {
                return Result.Failure<Response>($"Speaker with ID {context.Request.SpeakerId} does not exist.");
            }

            if (context.Request.IsPrimary == true)
            {
                // Set all existing biographies for the speaker to non-primary
                var existingBios = dbContext.SpeakerBios
                    .Where(b => b.SpeakerId == context.Request.SpeakerId && b.IsPrimary);

                if (existingBios.Any())
                {
                    existingBios.ToList().ForEach(b => b.IsPrimary = false);
                }
            }

            var biography = new Infrastructure.Models.SpeakerBio
            {
                SpeakerBioId = Guid.NewGuid(),
                SpeakerId = context.Request.SpeakerId,
                Bio = context.Request.Biography,
                IsPrimary = context.Request.IsPrimary
            };

            dbContext.SpeakerBios.Add(biography);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Result.Success(new Response(biography.SpeakerBioId));
        }
    }


    internal class SpeakerBiographyRequest
    {
        public string Biography { get; set; }
        public bool IsPrimary { get; set; }
    }
}
