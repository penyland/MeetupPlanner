using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace MeetupPlanner.Features.Locations.Commands;

public static class UpdateLocation
{
    public sealed record Command(Guid LocationId, AddLocation.LocationRequest Location);
    public sealed record Response(Guid LocationId);

    internal sealed class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            var location = await dbContext.Locations
                .FirstOrDefaultAsync(l => l.LocationId == context.Request.LocationId, cancellationToken);

            if (location == null)
            {
                return Result.Failure<Response>($"Location with ID '{context.Request.LocationId}' not found.");
            }

            location.Name = context.Request.Location.Name;
            location.Street = context.Request.Location.Street;
            location.City = context.Request.Location.City;
            location.PostalCode = context.Request.Location.PostalCode;
            location.Country = context.Request.Location.Country;
            location.Description = context.Request.Location.Description;
            location.MaxCapacity = context.Request.Location.MaxCapacity;
            location.IsActive = context.Request.Location.IsActive;

            await dbContext.SaveChangesAsync(cancellationToken);
            return Result.Success(new Response(location.LocationId));
        }
    }

    internal sealed class UpdateLocationValidator : AbstractValidator<Command>
    {
        public UpdateLocationValidator()
        {
            RuleFor(x => x.Location.Name)
                .NotEmpty().WithMessage("Location name is required.")
                .MaximumLength(200).WithMessage("Location name cannot exceed 200 characters.");

            RuleFor(x => x.Location.Street)
                .NotEmpty().WithMessage("Street address is required.")
                .MaximumLength(300).WithMessage("Street address cannot exceed 300 characters.");

            RuleFor(x => x.Location.City)
                .NotEmpty().WithMessage("City is required.")
                .MinimumLength(2)
                .MaximumLength(100)
                .WithMessage("City must be between 2 and 100 characters.");

            RuleFor(x => x.Location.PostalCode)
                .NotEmpty().WithMessage("Postal code is required.")
                .MaximumLength(6).WithMessage("Postal code cannot exceed 6 characters.");

            RuleFor(x => x.Location.Country)
                .NotEmpty().WithMessage("Country is required.")
                .MaximumLength(100).WithMessage("Country cannot exceed 100 characters.");

            RuleFor(x => x.Location.MaxCapacity)
                .GreaterThan(0).WithMessage("Max capacity must be greater than zero.");

            RuleFor(x => x.Location.Description)
                .MaximumLength(2048).WithMessage("Description cannot exceed 2048 characters.");
        }
    }
}
