using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace WorkFlo.Infrastructure.Configuration;

public static class DatabaseServiceExtensions
{
    /// <summary>
    /// Adds Entity Framework services with PostgreSQL and schema separation
    /// </summary>
    public static IServiceCollection AddDatabaseServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Main application database context
        services.AddDbContext<WorkFloDbContext>(options =>
        {
            // Check if we should use in-memory database for development
            bool useInMemory = configuration.GetValue<bool>("Database:UseInMemory");

            if (useInMemory)
            {
                options.UseInMemoryDatabase("WorkFloDb");
            }
            else
            {
                string? connectionString = configuration.GetConnectionString("DefaultConnection");

                options.UseNpgsql(connectionString, npgsqlOptions =>
                {
                    npgsqlOptions.EnableRetryOnFailure(
                        3,
                        TimeSpan.FromSeconds(5),
                        null);

                    // Enable advanced PostgreSQL features
                    npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                    npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "public");
                });
            }

            // Enable sensitive data logging in development
            if (configuration.GetValue<bool>("Logging:EnableSensitiveDataLogging"))
            {
                options.EnableSensitiveDataLogging();
            }

            // Enable detailed errors in development
            if (string.Equals(configuration.GetValue<string>("ASPNETCORE_ENVIRONMENT"), "Development",
                    StringComparison.Ordinal))
            {
                options.EnableDetailedErrors();
            }
        });

        // Register repository interfaces
        services.AddScoped<IUserRepository, UserRepository>();

        // TODO: Additional repositories will be registered when implemented:
        // - ITaskRepository
        // - IFocusSessionRepository  
        // - IAnalyticsRepository

        return services;
    }

    /// <summary>
    /// Ensures database is created and migrations are applied
    /// </summary>
    public static async Task<IServiceProvider> EnsureDatabaseAsync(this IServiceProvider serviceProvider)
    {
#pragma warning disable MA0004, CA2007 // ConfigureAwait not supported with await using
        await using AsyncServiceScope scope = serviceProvider.CreateAsyncScope().ConfigureAwait(false);
#pragma warning restore MA0004, CA2007
        WorkFloDbContext context = scope.ServiceProvider.GetRequiredService<WorkFloDbContext>();
        IConfiguration configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        try
        {
            // For in-memory database, just ensure it's created
            bool useInMemory = configuration.GetValue<bool>("Database:UseInMemory");
            if (useInMemory)
            {
                await context.Database.EnsureCreatedAsync().ConfigureAwait(false);
            }
            else
            {
                // For real database, apply migrations
                await context.Database.MigrateAsync().ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            // Log error but don't crash the application
            ILogger<WorkFloDbContext>? logger = scope.ServiceProvider.GetService<ILogger<WorkFloDbContext>>();
            logger?.LogError(ex, "An error occurred while setting up the database");
            throw;
        }

        return serviceProvider;
    }
}

// Repository interfaces for other entities

// Basic repository implementations
