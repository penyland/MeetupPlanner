using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.AspNetCore;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MeetupPlanner.Features.Locations;

public static class AddLocation
{
    public sealed record Command(LocationRequest Location);

    public sealed record Response(Guid LocationId);

    internal class Handler(MeetupPlannerDbContext dbContext) : IRequestHandler<Command, Result<Response>>
    {
        public async Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            try
            {
                var location = new Infrastructure.Models.Location
                {
                    LocationId = Guid.NewGuid(),
                    Name = context.Request.Location.Name,
                    Street = context.Request.Location.Street,
                    City = context.Request.Location.City,
                    PostalCode = context.Request.Location.PostalCode,
                    Country = context.Request.Location.Country,
                    Description = context.Request.Location.Description,
                    MaxCapacity = context.Request.Location.MaxCapacity,
                    IsActive = context.Request.Location.IsActive,
                };

                dbContext.Locations.Add(location);
                await dbContext.SaveChangesAsync(cancellationToken);

                return Result.Success(new Response(location.LocationId));
            }
            catch (Exception ex)
            {
                return Result.Failure<Response>(ex);
            }
        }
    }

    internal class ValidatorHandler(IRequestHandler<AddLocation.Command, Result<AddLocation.Response>> innerHandler, IValidator<AddLocation.Command> validator, ILogger<ValidatorHandler> logger) : IRequestHandler<Command, Result<Response>>
    {
        public Task<Result<Response>> HandleAsync(IHandlerContext<Command> context, CancellationToken cancellationToken = default)
        {
            logger?.LogInformation("Validating AddLocation command for location: {LocationName}", context.Request.Location.Name);

            var validationResult = validator.Validate(context.Request);

            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => new ValidationError(e.PropertyName, e.ErrorMessage)).ToList();
                var result = Result.Failure<Response>("Validation failed for AddLocation.", errors);

                return Task.FromResult(result);
            }

            return innerHandler.HandleAsync(context, cancellationToken);
        }
    }

    internal sealed class CommandValidator : AbstractValidator<Command>
    {
        public CommandValidator()
        {
            RuleFor(x => x.Location.Name)
                .NotEmpty().WithMessage("Location name is required.")
                .MaximumLength(200).WithMessage("Location name cannot exceed 200 characters.");

            RuleFor(x => x.Location.Street)
                .NotEmpty().WithMessage("Street address is required.")
                .MaximumLength(300).WithMessage("Street address cannot exceed 300 characters.");

            RuleFor(x => x.Location.City)
                .NotEmpty().WithMessage("City is required.")
                .MinimumLength(4)
                .MaximumLength(100)
                .WithMessage("City must be between 4 and 100 characters.");

            RuleFor(x => x.Location.PostalCode)
                .NotEmpty().WithMessage("Postal code is required.")
                .Matches(@"^\d{3} \d{2}$").WithMessage("Postal code must be in the format '123 45'.")
                .MaximumLength(6).WithMessage("Postal code cannot exceed 6 characters.");

            RuleFor(x => x.Location.Country)
                .NotEmpty().WithMessage("Country is required.")
                .MaximumLength(100).WithMessage("Country cannot exceed 100 characters.");

            RuleFor(x => x.Location.MaxCapacity)
                .GreaterThan(0).WithMessage("Max capacity must be greater than zero.");
        }
    }

    public record LocationRequest
    {
        public string Name { get; init; } = string.Empty;
        public string Street { get; init; } = string.Empty;
        public string City { get; init; } = string.Empty;
        public string PostalCode { get; init; } = string.Empty;
        public string Country { get; init; } = string.Empty;
        public string Description { get; init; } = string.Empty;
        public int MaxCapacity { get; init; }
        public bool IsActive { get; init; }
    }

    public static RouteGroupBuilder MapPostLocation(this RouteGroupBuilder builder, string path)
    {
        builder.MapPost(path, async (LocationRequest request, [FromServices] IRequestHandler<AddLocation.Command, Result<AddLocation.Response>> handler) =>
        {
            var command = new AddLocation.Command(request);

            var context = new HandlerContext<AddLocation.Command>
            {
                Body = BinaryData.FromObjectAsJson(command),
                Request = command
            };

            var result = await handler.HandleAsync(context);

            IResult response = result switch
            {
                ErrorResult<Response> failure => TypedResults.Problem(failure.ToProblemDetails()),
                Success => TypedResults.Created($"/{path}/{result.Value.LocationId}", result.Value.LocationId),
                _ => TypedResults.BadRequest("Failed to process request.")
            };

            return response;
        })
        .Produces<Guid>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .RequireAuthorization();

        return builder;
    }
}
