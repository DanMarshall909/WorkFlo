using WorkFlo.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;

namespace WorkFlo.Api.Tests.Helpers;

/// <summary>
/// Clean, simplified WebApplicationFactory for integration tests
/// Replaces the complex TestWebApplicationFactory with a maintainable implementation
/// </summary>
internal class CleanTestWebApplicationFactory : BaseTestWebApplicationFactory
{
    /// <summary>
    /// Creates a new test factory with optional debug logging
    /// </summary>
    public CleanTestWebApplicationFactory(bool enableDebugLogging = false)
        : base(enableDebugLogging)
    {
    }

    /// <summary>
    /// Factory with rate limiting enabled for specific tests
    /// </summary>
    public static BaseTestWebApplicationFactory WithRateLimiting(bool enableDebugLogging = false)
    {
        return new RateLimitEnabledFactory(enableDebugLogging);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            // Clean up test database
            try
            {
                using var scope = Services.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AnchorDbContext>();
                context.Database.EnsureDeleted();
            }
            catch (ObjectDisposedException)
            {
                // Services already disposed, ignore
            }
        }

        base.Dispose(disposing);
    }

    /// <summary>
    /// Specialized factory for rate limiting tests
    /// </summary>
    private sealed class RateLimitEnabledFactory : BaseTestWebApplicationFactory
    {
        public RateLimitEnabledFactory(bool enableDebugLogging) : base(enableDebugLogging)
        {
        }

        protected override TestConfigurationBuilder BuildTestConfiguration()
        {
            return TestConfigurationBuilder.CreateDefault()
                .WithRateLimitingEnabled(); // Override to enable rate limiting
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                // Clean up test database
                try
                {
                    using var scope = Services.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<AnchorDbContext>();
                    context.Database.EnsureDeleted();
                }
                catch (ObjectDisposedException)
                {
                    // Services already disposed, ignore
                }
            }

            base.Dispose(disposing);
        }
    }
}
