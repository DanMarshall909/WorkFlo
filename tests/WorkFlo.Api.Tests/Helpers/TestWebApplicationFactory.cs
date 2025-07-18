using WorkFlo.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;

namespace WorkFlo.Api.Tests.Helpers;

/// <summary>
/// Custom WebApplicationFactory for integration tests following Ardalis Clean Architecture patterns
/// Configures in-memory database and mock services for reliable testing
/// 
/// NOTE: This factory has been refactored to use the new modular approach.
/// For new tests, consider using CleanTestWebApplicationFactory instead.
/// This class is kept for backward compatibility with existing tests.
/// </summary>
public sealed class TestWebApplicationFactory : BaseTestWebApplicationFactory
{
    /// <summary>
    /// Creates a new test factory instance with debug logging enabled for backward compatibility
    /// </summary>
    public TestWebApplicationFactory() : base(enableDebugLogging: true)
    {
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
