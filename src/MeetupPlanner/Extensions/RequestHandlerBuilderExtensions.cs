using FluentValidation;
using Infinity.Toolkit;
using Infinity.Toolkit.Handlers;
using MeetupPlanner.Features.Speakers.Commands;
using Microsoft.Extensions.DependencyInjection;

namespace MeetupPlanner.Extensions;

public static class RequestHandlerBuilderExtensions
{
    /// <summary>
    /// Decorates all registered instances of <see cref="IRequestHandler{TRequest}"/> using the specified type <typeparamref name="TValidator"/>.
    /// </summary>
    /// <typeparam name="TCommand">The command type.</typeparam>
    /// <typeparam name="TValidator">The decorator type.</typeparam>
    /// <returns>A <see cref="RequestHandlerBuilder"/> instance used to configure the request handler.</returns>
    //public static RequestHandlerBuilder AddValidator<TCommand, TValidator>(this RequestHandlerBuilder builder)
    //    where TValidator : class
    //{
    //    builder.AddScoped<IValidator<TCommand>, TValidator>();
    //    builder.Services.AddRequestHandler<AddSpeakerBiography.Command, Result<AddSpeakerBiography.Response>, AddSpeakerBiography.Handler>()
    //        .Decorate<ValidatorHandler<AddSpeakerBiography.Command, AddSpeakerBiography.Response>>();


    //    return builder;
    //}
}
