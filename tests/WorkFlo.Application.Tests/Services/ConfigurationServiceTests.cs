using FluentAssertions;
using WorkFlo.Application.Services;
using WorkFlo.Domain.Common;
using Xunit;

namespace WorkFlo.Application.Tests.Services;

public class ConfigurationServiceTests
{
    [Fact]
    public async Task configuration_loads_default_values_when_file_missingAsync()
    {
        // Arrange
        var configPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString(), "nonexistent.json");
        var service = new ConfigurationService(configPath);

        // Act
        var result = await service.LoadConfigAsync();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Api.Port.Should().Be(5000);
        result.Value.Api.EnableHttps.Should().BeFalse();
        result.Value.Validation.EnableTdd.Should().BeTrue();
        result.Value.Validation.EnableCommitMsg.Should().BeTrue();
        result.Value.Tdd.EnforceTransitions.Should().BeTrue();
        result.Value.Tdd.AllowSkipPhases.Should().BeFalse();
    }

    [Fact]
    public async Task configuration_loads_values_from_valid_json_fileAsync()
    {
        // Arrange
        var tempPath = Path.GetTempPath();
        var configDir = Path.Combine(tempPath, Guid.NewGuid().ToString());
        Directory.CreateDirectory(configDir);
        var configPath = Path.Combine(configDir, "config.json");

        var json = """
        {
          "api": { "port": 8080, "enableHttps": true },
          "validation": { "enableTdd": false, "enableCommitMsg": false },
          "tdd": { "enforceTransitions": false, "allowSkipPhases": true }
        }
        """;

        await File.WriteAllTextAsync(configPath, json);
        var service = new ConfigurationService(configPath);

        try
        {
            // Act
            var result = await service.LoadConfigAsync();

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Api.Port.Should().Be(8080);
            result.Value.Api.EnableHttps.Should().BeTrue();
            result.Value.Validation.EnableTdd.Should().BeFalse();
            result.Value.Validation.EnableCommitMsg.Should().BeFalse();
            result.Value.Tdd.EnforceTransitions.Should().BeFalse();
            result.Value.Tdd.AllowSkipPhases.Should().BeTrue();
        }
        finally
        {
            Directory.Delete(configDir, true);
        }
    }

    [Fact]
    public async Task configuration_returns_error_for_invalid_jsonAsync()
    {
        // Arrange
        var tempPath = Path.GetTempPath();
        var configDir = Path.Combine(tempPath, Guid.NewGuid().ToString());
        Directory.CreateDirectory(configDir);
        var configPath = Path.Combine(configDir, "config.json");

        await File.WriteAllTextAsync(configPath, "{ invalid json }");
        var service = new ConfigurationService(configPath);

        try
        {
            // Act
            var result = await service.LoadConfigAsync();

            // Assert
            result.IsFailure().Should().BeTrue();
            result.Error.Should().Contain("JSON");
        }
        finally
        {
            Directory.Delete(configDir, true);
        }
    }

    [Fact]
    public async Task api_settings_returns_configured_valuesAsync()
    {
        // Arrange
        var tempPath = Path.GetTempPath();
        var configDir = Path.Combine(tempPath, Guid.NewGuid().ToString());
        Directory.CreateDirectory(configDir);
        var configPath = Path.Combine(configDir, "config.json");

        var json = """{ "api": { "port": 9000, "enableHttps": true } }""";
        await File.WriteAllTextAsync(configPath, json);
        var service = new ConfigurationService(configPath);

        try
        {
            // Act
            var result = await service.GetApiSettingsAsync();

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Port.Should().Be(9000);
            result.Value.EnableHttps.Should().BeTrue();
        }
        finally
        {
            Directory.Delete(configDir, true);
        }
    }

    [Fact]
    public async Task validation_settings_returns_configured_valuesAsync()
    {
        // Arrange
        var tempPath = Path.GetTempPath();
        var configDir = Path.Combine(tempPath, Guid.NewGuid().ToString());
        Directory.CreateDirectory(configDir);
        var configPath = Path.Combine(configDir, "config.json");

        var json = """{ "validation": { "enableTdd": false, "enableCommitMsg": false } }""";
        await File.WriteAllTextAsync(configPath, json);
        var service = new ConfigurationService(configPath);

        try
        {
            // Act
            var result = await service.GetValidationRulesAsync();

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.EnableTdd.Should().BeFalse();
            result.Value.EnableCommitMsg.Should().BeFalse();
        }
        finally
        {
            Directory.Delete(configDir, true);
        }
    }

    [Fact]
    public async Task tdd_settings_returns_configured_valuesAsync()
    {
        // Arrange
        var tempPath = Path.GetTempPath();
        var configDir = Path.Combine(tempPath, Guid.NewGuid().ToString());
        Directory.CreateDirectory(configDir);
        var configPath = Path.Combine(configDir, "config.json");

        var json = """{ "tdd": { "enforceTransitions": false, "allowSkipPhases": true } }""";
        await File.WriteAllTextAsync(configPath, json);
        var service = new ConfigurationService(configPath);

        try
        {
            // Act
            var result = await service.GetTddSettingsAsync();

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.EnforceTransitions.Should().BeFalse();
            result.Value.AllowSkipPhases.Should().BeTrue();
        }
        finally
        {
            Directory.Delete(configDir, true);
        }
    }

    [Fact]
    public async Task configuration_handles_partial_json_gracefullyAsync()
    {
        // Arrange
        var tempPath = Path.GetTempPath();
        var configDir = Path.Combine(tempPath, Guid.NewGuid().ToString());
        Directory.CreateDirectory(configDir);
        var configPath = Path.Combine(configDir, "config.json");

        var json = """{ "api": { "port": 7000 } }"""; // Only partial config
        await File.WriteAllTextAsync(configPath, json);
        var service = new ConfigurationService(configPath);

        try
        {
            // Act
            var result = await service.LoadConfigAsync();

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Api.Port.Should().Be(7000); // Custom value
            result.Value.Api.EnableHttps.Should().BeFalse(); // Default value
            result.Value.Validation.EnableTdd.Should().BeTrue(); // Default value
        }
        finally
        {
            Directory.Delete(configDir, true);
        }
    }
}
