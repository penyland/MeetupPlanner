using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;

namespace MeetupPlanner.Shared;

/// <summary>
/// Provides a request handler that validates incoming commands before delegating processing to an inner handler. If
/// validation fails, returns a failure result containing validation error messages.
/// </summary>
/// <remarks>This handler ensures that commands are validated using the specified validator prior to execution. If
/// validation fails, the inner handler is not invoked and a failure result is returned. This pattern helps enforce
/// input correctness and centralizes validation logic in the request handling pipeline.</remarks>
/// <typeparam name="TCommand">The type of the command to be validated and handled. Must be a reference type.</typeparam>
/// <typeparam name="TResponse">The type of the response returned by the handler. Must be a reference type.</typeparam>
/// <param name="innerHandler">The inner request handler that processes the command if validation succeeds.</param>
/// <param name="validator">The validator used to validate the incoming command before handling.</param>
public sealed class ValidatorHandler<TCommand, TResponse>(IRequestHandler<TCommand, Result<TResponse>> innerHandler, IValidator<TCommand> validator) : IRequestHandler<TCommand, Result<TResponse>>
    where TCommand : class
    where TResponse : class
{
    public async Task<Result<TResponse>> HandleAsync(IHandlerContext<TCommand> context, CancellationToken cancellationToken = default)
    {
        var validationResult = await validator.ValidateAsync(context.Request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
            return Result.Failure<TResponse>(errors);
        }
        return await innerHandler.HandleAsync(context, cancellationToken);
    }
}

