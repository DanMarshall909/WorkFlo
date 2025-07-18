using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;
using System.Linq;

namespace WorkFlo.Api.Tests.Helpers;

/// <summary>
/// Base factory for web application testing with configurable options
/// Provides common functionality while allowing customization
/// </summary>
#pragma warning disable CA1515
public abstract class BaseTestWebApplicationFactory : WebApplicationFactory<Program>
#pragma warning restore CA1515
{
    private readonly string _instanceId = Guid.NewGuid().ToString("N")[..8];
    private readonly bool _enableDebugLogging;

    protected BaseTestWebApplicationFactory(bool enableDebugLogging = false)
    {
        _enableDebugLogging = enableDebugLogging;

        if (_enableDebugLogging)
        {
            Console.WriteLine($"[FACTORY-{_instanceId}] Creating {GetType().Name} instance");
        }
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        // Configure application settings
        builder.ConfigureAppConfiguration((context, config) =>
        {
            var testConfig = BuildTestConfiguration();
            testConfig.ApplyTo(config);
        });

        // Configure services
        builder.ConfigureServices(services =>
        {
            ConfigureTestServices(services);

            // Configure a test authentication scheme that allows anonymous access
            services.AddAuthentication(TestAuthHandler.AuthenticationScheme)
                    .AddScheme<TestAuthHandlerOptions, TestAuthHandler>(TestAuthHandler.AuthenticationScheme, options => { });

            if (_enableDebugLogging)
            {
                LogServiceConfiguration(services);
            }
        });
    }

    /// <summary>
    /// Override to customize test configuration
    /// </summary>
    protected virtual TestConfigurationBuilder BuildTestConfiguration()
    {
        return TestConfigurationBuilder.CreateDefault();
    }

    /// <summary>
    /// Override to customize service configuration
    /// </summary>
    protected virtual void ConfigureTestServices(IServiceCollection services)
    {
        var databaseName = $"TestDb_{GetHashCode()}_{_instanceId}";
        TestServiceConfigurator.ConfigureTestServices(services, databaseName);

        // Add FastEndpoints to scan the WorkFlo.Api assembly for endpoints
        services.AddFastEndpoints(options => options.Assemblies = new[] { typeof(Program).Assembly });
    }

    /// <summary>
    /// Logs service configuration for debugging
    /// </summary>
    private void LogServiceConfiguration(IServiceCollection services)
    {
        var customServices = services
            .Where(s => IsCustomService(s.ServiceType))
            .OrderBy(s => s.ServiceType.Name, StringComparer.Ordinal)
            .ToList();

        Console.WriteLine($"[FACTORY-{_instanceId}] Configured {customServices.Count} custom services");

        if (customServices.Count > 0 && _enableDebugLogging)
        {
            foreach (var service in customServices.Take(10)) // Limit output
            {
                var impl = service.ImplementationType?.Name ??
                          service.ImplementationInstance?.GetType().Name ??
                          "Factory";
                Console.WriteLine($"  {service.ServiceType.Name} -> {impl}");
            }

            if (customServices.Count > 10)
            {
                Console.WriteLine($"  ... and {customServices.Count - 10} more services");
            }
        }
    }

    /// <summary>
    /// Determines if a service type is custom (not framework)
    /// </summary>
    private static bool IsCustomService(Type serviceType)
    {
        if (serviceType.Namespace == null)
        {
            return false;
        }

        var frameworkNamespaces = new[]
        {
            "Microsoft.Extensions",
            "Microsoft.AspNetCore",
            "System.",
            "Microsoft.EntityFrameworkCore.Design",
            "NSwag",
            "FastEndpoints.Swagger"
        };

        return !frameworkNamespaces.Any(ns => serviceType.Namespace.StartsWith(ns, StringComparison.Ordinal));
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing && _enableDebugLogging)
        {
            Console.WriteLine($"[FACTORY-{_instanceId}] Disposing {GetType().Name}");
        }

        base.Dispose(disposing);
    }
}
