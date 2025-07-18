using WorkFlo.Application.Common.Behaviors;
using WorkFlo.Application.Common.Messaging;
using WorkFlo.Application.Common.Messaging.Adapters;
using WorkFlo.Application.Common.Validation;
using WorkFlo.Application.Common.Validation.Adapters;
using FastEndpoints;
using FluentValidation;
using MediatR;

namespace WorkFlo.Api.Configuration;

/// <summary>
/// Extension methods for configuring services in the DI container
/// </summary>
internal static class ServiceExtensions
{
    /// <summary>
    /// Add MediatR services with CQRS pipeline behaviors
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddMediatRServices(this IServiceCollection services)
    {
        // Register MediatR from Application assembly
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(WorkFlo.Application.Common.CQRS.ICommand).Assembly);

            // Add pipeline behaviors in order of execution
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        });

        // Register abstraction layer for MediatR using Scrutor
        services.Scan(scan => scan
            .FromAssemblyOf<MediatRCommandDispatcher>()
            .AddClasses(classes => classes.InNamespaces("WorkFlo.Application.Common.Messaging.Adapters"))
            .AsImplementedInterfaces()
            .WithScopedLifetime());

        return services;
    }

    /// <summary>
    /// Add FluentValidation services and discover all validators
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddValidationServices(this IServiceCollection services)
    {
        // Register all validators from Application assembly
        services.AddValidatorsFromAssembly(typeof(WorkFlo.Application.Common.CQRS.ICommand).Assembly);

        // Register validation abstraction layer using Scrutor
        // Exclude wrapper adapters that shouldn't be registered as services
        services.Scan(scan => scan
            .FromAssemblyOf<FluentValidationAdapter<object>>()
            .AddClasses(classes => classes
                .InNamespaces("WorkFlo.Application.Common.Validation.Adapters")
                .Where(type => !type.Name.EndsWith("FailureAdapter", StringComparison.InvariantCulture) &&
                               !type.Name.EndsWith("ResultAdapter", StringComparison.InvariantCulture)))
            .AsImplementedInterfaces()
            .WithScopedLifetime());

        // Register validator provider
        services.AddScoped<IValidatorProvider, FluentValidatorProvider>();

        return services;
    }

    /// <summary>
    /// Add FastEndpoints services and configuration
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddFastEndpointsServices(this IServiceCollection services)
    {
        // Register FastEndpoints
        services.AddFastEndpoints();

        return services;
    }

    /// <summary>
    /// Add application-specific services (repositories, domain services, etc.)
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Currently no application-specific services beyond auth
        // This method is kept for future extensibility

        return services;
    }
}
