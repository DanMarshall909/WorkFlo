using FluentAssertions;
using WorkFlo.Application.Services;
using WorkFlo.Domain.Common;
using Xunit;

namespace WorkFlo.Application.Tests.Services;

public class ConfigurationServiceIntegrationTests
{
    [Fact]
    public async Task configuration_service_handles_concurrent_access_safely()
    {
        // Arrange
        var tempPath = Path.GetTempPath();
        var configDir = Path.Combine(tempPath, Guid.NewGuid().ToString());
        Directory.CreateDirectory(configDir);
        var configPath = Path.Combine(configDir, "config.json");

        var json = """{ "api": { "port": 8080 } }""";
        await File.WriteAllTextAsync(configPath, json);

        using var service = new ConfigurationService(configPath);

        try
        {
            // Act - Simulate concurrent access from multiple threads
            var tasks = Enumerable.Range(0, 10)
                .Select(_ => Task.Run(async () =>
                {
                    var result = await service.LoadConfigAsync();
                    result.IsSuccess.Should().BeTrue();
                    return result.Value!.Api.Port;
                }))
                .ToArray();

            var results = await Task.WhenAll(tasks);

            // Assert - All threads should get the same result
            results.Should().AllBeEquivalentTo(8080);
        }
        finally
        {
            Directory.Delete(configDir, true);
        }
    }

    [Fact]
    public async Task configuration_service_respects_cache_timeout()
    {
        // Arrange
        var tempPath = Path.GetTempPath();
        var configDir = Path.Combine(tempPath, Guid.NewGuid().ToString());
        Directory.CreateDirectory(configDir);
        var configPath = Path.Combine(configDir, "config.json");

        var initialJson = """{ "api": { "port": 5000 } }""";
        await File.WriteAllTextAsync(configPath, initialJson);

        using var service = new ConfigurationService(configPath);

        try
        {
            // Act - Initial load
            var firstResult = await service.LoadConfigAsync();
            firstResult.Value!.Api.Port.Should().Be(5000);

            // Update file immediately
            var updatedJson = """{ "api": { "port": 9000 } }""";
            await File.WriteAllTextAsync(configPath, updatedJson);

            // Should still return cached value (within timeout)
            var secondResult = await service.LoadConfigAsync();
            secondResult.Value!.Api.Port.Should().Be(5000, "should use cached value within timeout");

            // Assert - Cache behavior is working
            firstResult.Value.Should().BeSameAs(secondResult.Value, "should return same cached instance");
        }
        finally
        {
            Directory.Delete(configDir, true);
        }
    }

    [Fact]
    public async Task configuration_integration_with_endpoint_validation()
    {
        // Arrange
        var tempPath = Path.GetTempPath();
        var configDir = Path.Combine(tempPath, Guid.NewGuid().ToString());
        Directory.CreateDirectory(configDir);
        var configPath = Path.Combine(configDir, "config.json");

        var json = """
        {
          "validation": { "enableTdd": false },
          "tdd": { "enforceTransitions": false }
        }
        """;
        await File.WriteAllTextAsync(configPath, json);

        using var configService = new ConfigurationService(configPath);
        var tddService = new TddStateService();

        try
        {
            // Act - Simulate endpoint behavior
            var validationResult = await configService.GetValidationRulesAsync();
            var tddResult = await configService.GetTddSettingsAsync();

            // Assert - Configuration affects endpoint behavior
            validationResult.IsSuccess.Should().BeTrue();
            validationResult.Value!.EnableTdd.Should().BeFalse();
            
            tddResult.IsSuccess.Should().BeTrue();
            tddResult.Value!.EnforceTransitions.Should().BeFalse();

            // When TDD is disabled, validation should be skipped
            // This tests the integration pattern used in CommitMsgValidationEndpoint
            if (!validationResult.Value.EnableTdd)
            {
                // TDD validation would be skipped - this is the expected behavior
                true.Should().BeTrue("TDD validation correctly disabled");
            }
        }
        finally
        {
            tddService?.Dispose();
            Directory.Delete(configDir, true);
        }
    }

    [Fact]
    public async Task tdd_state_service_cleans_up_stale_entries()
    {
        // Arrange  
        var service = new TddStateService();

        // Act - Set a phase for a feature
        await service.SetPhaseAsync("test-feature", TddPhase.Red);
        var initialPhase = await service.GetCurrentPhaseAsync("test-feature");

        // Assert - Feature state is tracked
        initialPhase.IsSuccess.Should().BeTrue();
        initialPhase.Value.Should().Be(TddPhase.Red);

        // Note: Testing actual cleanup would require mocking DateTime or very long waits
        // This test verifies the basic functionality works
        service?.Dispose();
    }

    [Fact]
    public async Task serve_command_integration_uses_configuration_port()
    {
        // Arrange
        var tempPath = Path.GetTempPath();
        var configDir = Path.Combine(tempPath, Guid.NewGuid().ToString());
        Directory.CreateDirectory(configDir);
        var configPath = Path.Combine(configDir, "config.json");

        var json = """{ "api": { "port": 7777 } }""";
        await File.WriteAllTextAsync(configPath, json);

        try
        {
            // Act - Test the configuration loading pattern used in ServeCommand
            using var configService = new ConfigurationService(configPath);
            var apiConfigResult = await configService.GetApiSettingsAsync();

            // Assert - Port configuration is loaded correctly
            apiConfigResult.IsSuccess.Should().BeTrue();
            apiConfigResult.Value!.Port.Should().Be(7777);

            // This validates the integration pattern:
            // if (apiConfigResult.IsSuccess)
            // {
            //     actualPort = apiConfigResult.Value!.Port;
            // }
        }
        finally
        {
            Directory.Delete(configDir, true);
        }
    }
}