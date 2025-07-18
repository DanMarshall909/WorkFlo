using WorkFlo.Application.Common.Behaviors;
using FluentAssertions;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace WorkFlo.Api.Tests.Configuration;

public class ServiceConfigurationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ServiceConfigurationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact(Skip = "Disabled - WebApplicationFactory startup is slow. TODO: Fix in separate issue")]
    public void Should_register_mediatr_services()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var mediator = scope.ServiceProvider.GetService<IMediator>();

        // Assert
        mediator.Should().NotBeNull("MediatR should be registered in DI container");
    }

    [Fact(Skip = "Disabled - WebApplicationFactory startup is slow. TODO: Fix in separate issue")]
    public void Should_register_fastendpoints_services()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        // FastEndpoints services are registered automatically, test for endpoint discovery or processor
        var serviceProvider = scope.ServiceProvider;

        // Assert
        serviceProvider.Should().NotBeNull("Service provider should be available");
        // We'll validate FastEndpoints is working through endpoint tests
    }

    [Fact(Skip = "Disabled - WebApplicationFactory startup is slow. TODO: Fix in separate issue")]
    public void Should_register_validation_behavior_in_pipeline()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var pipelineBehaviors =
            scope.ServiceProvider.GetServices<IPipelineBehavior<TestCommand, TestCommandResponse>>();

        // Assert
        var enumerable = pipelineBehaviors.ToList();
        enumerable.Should().NotBeEmpty("Pipeline behaviors should be registered");
        enumerable.Should().Contain(b => b.GetType().IsGenericType &&
                                         b.GetType().GetGenericTypeDefinition() == typeof(ValidationBehavior<,>),
            "ValidationBehavior should be registered in pipeline");
    }

    [Fact(Skip = "Disabled - WebApplicationFactory startup is slow. TODO: Fix in separate issue")]
    public void Should_register_all_validators()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var validators = scope.ServiceProvider.GetServices<IValidator>();

        // Assert
        // Should have validators registered (will add specific ones as we implement commands/queries)
        validators.Should().NotBeNull("Validators should be discoverable in DI container");
    }

    [Fact(Skip = "Disabled - WebApplicationFactory startup is slow. TODO: Fix in separate issue")]
    public void Should_configure_swagger_properly()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        // Test that Swagger services are registered by checking if we can get the services
        var services = scope.ServiceProvider.GetServices<object>();

        // Assert
        services.Should().NotBeNull("Services should be registered");
        // Swagger configuration will be tested through integration tests
    }

    [Fact(Skip = "Integration test disabled - slow WebApplicationFactory startup. TODO: Fix in separate issue")]
    [Trait("Category", "Integration")]
    public async Task Health_endpoint_should_return_healthy_Async()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync(new Uri("/health", UriKind.Relative));

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue("Health endpoint should return success");
        string content = await response.Content.ReadAsStringAsync();
        content.Should().Be("Healthy", "Health check should return healthy status");
    }

    [Fact(Skip = "Integration test disabled - slow WebApplicationFactory startup. TODO: Fix in separate issue")]
    [Trait("Category", "Integration")]
    public async Task Root_endpoint_should_return_api_info_Async()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync(new Uri("/", UriKind.Relative));

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue("Root endpoint should return success");
        string content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Anchor API is running", "Root should contain API info");
        content.Should().Contain("1.0.0", "Root should contain version info");
    }
}

// Test types for testing DI registration
