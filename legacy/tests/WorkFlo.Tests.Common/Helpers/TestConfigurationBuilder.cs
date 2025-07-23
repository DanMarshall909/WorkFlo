using Microsoft.Extensions.Configuration;

namespace WorkFlo.Tests.Common.Helpers;

/// <summary>
/// Builds test configuration for WebApplicationFactory
/// Provides fluent API for configuring test settings
/// </summary>
public sealed class TestConfigurationBuilder
{
    private readonly Dictionary<string, string?> _configuration = new(StringComparer.Ordinal);

    /// <summary>
    /// Creates a new test configuration builder with default test settings
    /// </summary>
    public static TestConfigurationBuilder CreateDefault()
    {
        return new TestConfigurationBuilder()
            .WithInMemoryDatabase()
            .WithRateLimitingDisabled();
    }

    /// <summary>
    /// Enables in-memory database for testing
    /// </summary>
    public TestConfigurationBuilder WithInMemoryDatabase()
    {
        _configuration["Database:UseInMemory"] = "true";
        return this;
    }

    /// <summary>
    /// Disables rate limiting for testing (default behavior)
    /// </summary>
    public TestConfigurationBuilder WithRateLimitingDisabled()
    {
        _configuration["RateLimit:DisableForTesting"] = "true";
        return this;
    }

    /// <summary>
    /// Enables rate limiting for specific tests
    /// </summary>
    public TestConfigurationBuilder WithRateLimitingEnabled()
    {
        _configuration["RateLimit:DisableForTesting"] = "false";
        return this;
    }

    /// <summary>
    /// Adds a custom configuration setting
    /// </summary>
    public TestConfigurationBuilder WithSetting(string key, string? value)
    {
        _configuration[key] = value;
        return this;
    }

    /// <summary>
    /// Applies the configuration to a configuration builder
    /// </summary>
    internal void ApplyTo(IConfigurationBuilder configBuilder)
    {
        configBuilder.AddInMemoryCollection(_configuration);
    }

    /// <summary>
    /// Gets the built configuration dictionary
    /// </summary>
    internal IReadOnlyDictionary<string, string?> Build() => _configuration;
}
