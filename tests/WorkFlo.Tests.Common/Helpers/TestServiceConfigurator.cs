using WorkFlo.Application.Auth.Services;
using WorkFlo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace WorkFlo.Tests.Common.Helpers;

/// <summary>
/// Handles test service configuration for WebApplicationFactory
/// Provides clean, type-safe service replacement for testing
/// </summary>
internal static class TestServiceConfigurator
{
    /// <summary>
    /// Configures all test services in the correct order
    /// </summary>
    public static void ConfigureTestServices(IServiceCollection services, string databaseName)
    {
        ConfigureDatabase(services, databaseName);
        ConfigureAuthenticationServices(services);
        ConfigureOAuthServices(services);
        ConfigureLogging(services);
    }

    /// <summary>
    /// Configures in-memory database for testing
    /// </summary>
    private static void ConfigureDatabase(IServiceCollection services, string databaseName)
    {
        // Remove existing DbContext registrations
        RemoveServices<WorkFloDbContext>(services);
        RemoveServices<DbContextOptions<WorkFloDbContext>>(services);
        RemoveServices<DbContextOptions>(services);

        // Add in-memory database
        services.AddDbContext<WorkFloDbContext>(options =>
        {
            options.UseInMemoryDatabase(databaseName);
            options.EnableSensitiveDataLogging();
        });
    }

    /// <summary>
    /// Configures test authentication services
    /// </summary>
    private static void ConfigureAuthenticationServices(IServiceCollection services)
    {
        // Replace authentication services with test implementations
        ReplaceService<IJwtTokenService, TestJwtTokenService>(services);
        ReplaceService<IPasswordHashingService, TestPasswordHashingService>(services);
        ReplaceService<IEmailHashingService, TestEmailHashingService>(services);
        ReplaceService<IPasswordBreachService, TestPasswordBreachService>(services);

        // Remove problematic authentication services
        string[] authTypesToRemove = new[]
        {
            "IAuthenticationService",
            "IAuthenticationSchemeProvider",
            "IAuthorizationService",
            "IAuthorizationPolicyProvider",
            "IAuthorizationHandlerProvider"
        };

        RemoveServicesByName(services, authTypesToRemove);
        RemoveServicesContaining(services, "Authentication", preserveTypes: new[]
        {
            typeof(IJwtTokenService),
            typeof(IPasswordHashingService),
            typeof(IEmailHashingService),
            typeof(IPasswordBreachService)
        });
        RemoveServicesContaining(services, "Authorization");
        RemoveServicesContaining(services, "Jwt", preserveTypes: new[] { typeof(IJwtTokenService) });
    }

    /// <summary>
    /// Configures test OAuth services
    /// </summary>
    private static void ConfigureOAuthServices(IServiceCollection services)
    {
        // Remove existing OAuth services
        RemoveServices<IOAuthService>(services);
        RemoveServicesByName(services, new[] { "GoogleOAuthService", "MicrosoftOAuthService" });

        // Register test OAuth services
        services.AddScoped<IOAuthService>(_ => new TestOAuthService("google"));
        services.AddScoped<IOAuthService>(_ => new TestOAuthService("microsoft"));
    }

    /// <summary>
    /// Configures test logging
    /// </summary>
    private static void ConfigureLogging(IServiceCollection services)
    {
        services.AddLogging(builder =>
        {
            builder.SetMinimumLevel(LogLevel.Warning); // Reduce noise in tests
            builder.AddConsole();
        });
    }

    /// <summary>
    /// Type-safe service replacement
    /// </summary>
    private static void ReplaceService<TInterface, TImplementation>(IServiceCollection services)
        where TInterface : class
        where TImplementation : class, TInterface
    {
        RemoveServices<TInterface>(services);
        services.AddScoped<TInterface, TImplementation>();
    }

    /// <summary>
    /// Removes all services of a specific type
    /// </summary>
    private static void RemoveServices<T>(IServiceCollection services)
    {
        List<ServiceDescriptor> descriptors = services.Where(d => d.ServiceType == typeof(T)).ToList();
        foreach (var descriptor in descriptors)
        {
            services.Remove(descriptor);
        }
    }

    /// <summary>
    /// Removes services by type name
    /// </summary>
    private static void RemoveServicesByName(IServiceCollection services, string[] typeNames)
    {
        List<ServiceDescriptor> descriptors = services
            .Where(d => typeNames.Any(name => d.ServiceType.Name.Contains(name)))
            .ToList();

        foreach (var descriptor in descriptors)
        {
            services.Remove(descriptor);
        }
    }

    /// <summary>
    /// Removes services containing specific text in their full name, with optional type preservation
    /// </summary>
    private static void RemoveServicesContaining(IServiceCollection services, string contains, Type[]? preserveTypes = null)
    {
        preserveTypes ??= Array.Empty<Type>();

        List<ServiceDescriptor> descriptors = services
            .Where(d => d.ServiceType.FullName?.Contains(contains, StringComparison.OrdinalIgnoreCase) == true)
            .Where(d => !preserveTypes.Contains(d.ServiceType))
            .ToList();

        foreach (var descriptor in descriptors)
        {
            services.Remove(descriptor);
        }
    }
}
