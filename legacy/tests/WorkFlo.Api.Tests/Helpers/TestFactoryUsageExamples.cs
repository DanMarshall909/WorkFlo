using System.Net.Http;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace WorkFlo.Api.Tests.Helpers;

/// <summary>
/// Examples showing how to use the new test factories
/// These tests demonstrate the clean API and various configuration options
/// </summary>
[Collection("IsolatedTests")]
public sealed class TestFactoryUsageExamples
{
    [Fact]
    public void CleanFactory_ShouldCreateSuccessfully()
    {
        // Arrange & Act
        using var factory = new CleanTestWebApplicationFactory();
        using var client = factory.CreateClient();

        // Assert
        client.Should().NotBeNull();
        factory.Services.Should().NotBeNull();
    }

    [Fact]
    public void CleanFactory_WithDebugLogging_ShouldWork()
    {
        // Arrange & Act
        using var factory = new CleanTestWebApplicationFactory(enableDebugLogging: true);
        using var client = factory.CreateClient();

        // Assert
        client.Should().NotBeNull();
    }

    [Fact]
    public void CleanFactory_WithRateLimiting_ShouldWork()
    {
        // Arrange & Act
        using var factory = CleanTestWebApplicationFactory.WithRateLimiting();
        using var client = factory.CreateClient();

        // Assert
        client.Should().NotBeNull();
    }

    [Fact]
    public void LegacyFactory_ShouldStillWork_ForBackwardCompatibility()
    {
        // Arrange & Act
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        // Assert
        client.Should().NotBeNull();
        factory.Services.Should().NotBeNull();
    }

    [Fact]
    public void Factories_ShouldHaveIsolatedDatabases()
    {
        // Arrange
        using var factory1 = new CleanTestWebApplicationFactory();
        using var factory2 = new CleanTestWebApplicationFactory();

        // Act
        var client1 = factory1.CreateClient();
        var client2 = factory2.CreateClient();

        // Assert
        client1.Should().NotBeNull();
        client2.Should().NotBeNull();

        // Factories should have different service instances
        factory1.Services.Should().NotBeSameAs(factory2.Services);
    }
}
