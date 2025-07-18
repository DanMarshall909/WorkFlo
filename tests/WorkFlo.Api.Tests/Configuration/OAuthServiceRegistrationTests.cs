using WorkFlo.Application.Auth.Services;
using WorkFlo.Infrastructure.Services.Auth;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace WorkFlo.Api.Tests.Configuration;

/// <summary>
/// Tests for OAuth service dependency injection registration
/// Ensures OAuth services are properly registered and available
/// GitHub Issue #18: Privacy-First Authentication System
/// </summary>
public class OAuthServiceRegistrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public OAuthServiceRegistrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public void should_register_google_oauth_service()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var oauthServices = scope.ServiceProvider.GetServices<IOAuthService>();

        // Assert
        oauthServices.Should().NotBeEmpty("OAuth services should be registered");
        oauthServices.Should().Contain(s => (s is GoogleOAuthService),
            "Google OAuth service should be registered");
    }

    [Fact]
    public void should_register_microsoft_oauth_service()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var oauthServices = scope.ServiceProvider.GetServices<IOAuthService>();

        // Assert
        oauthServices.Should().NotBeEmpty("OAuth services should be registered");
        oauthServices.Should().Contain(s => (s is MicrosoftOAuthService),
            "Microsoft OAuth service should be registered");
    }

    [Fact]
    public void should_register_both_oauth_providers()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var oauthServices = scope.ServiceProvider.GetServices<IOAuthService>().ToList();

        // Assert
        oauthServices.Should().HaveCount(2, "Both Google and Microsoft OAuth services should be registered");

        var providerNames = oauthServices.Select(s => s.ProviderName).ToList();
        providerNames.Should().Contain("google", "Google OAuth provider should be available");
        providerNames.Should().Contain("microsoft", "Microsoft OAuth provider should be available");
    }

    [Fact]
    public void should_register_google_oauth_config()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var googleConfig = scope.ServiceProvider.GetService<GoogleOAuthConfig>();

        // Assert
        googleConfig.Should().NotBeNull("Google OAuth configuration should be registered");
        googleConfig!.ClientId.Should().NotBeNullOrEmpty("Google OAuth client ID should be configured");
        googleConfig.ClientSecret.Should().NotBeNullOrEmpty("Google OAuth client secret should be configured");
        googleConfig.TokenEndpoint.Should().NotBeNullOrEmpty("Google OAuth token endpoint should be configured");
        googleConfig.UserInfoEndpoint.Should().NotBeNullOrEmpty("Google OAuth user info endpoint should be configured");
    }

    [Fact]
    public void should_register_microsoft_oauth_config()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var microsoftConfig = scope.ServiceProvider.GetService<MicrosoftOAuthConfig>();

        // Assert
        microsoftConfig.Should().NotBeNull("Microsoft OAuth configuration should be registered");
        microsoftConfig!.ClientId.Should().NotBeNullOrEmpty("Microsoft OAuth client ID should be configured");
        microsoftConfig.ClientSecret.Should().NotBeNullOrEmpty("Microsoft OAuth client secret should be configured");
        microsoftConfig.TokenEndpoint.Should().NotBeNullOrEmpty("Microsoft OAuth token endpoint should be configured");
        microsoftConfig.UserInfoEndpoint.Should().NotBeNullOrEmpty("Microsoft OAuth user info endpoint should be configured");
    }

    [Fact]
    public void google_oauth_service_should_have_correct_provider_name()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var oauthServices = scope.ServiceProvider.GetServices<IOAuthService>();
        var googleService = oauthServices.FirstOrDefault(s => (s is GoogleOAuthService));

        // Assert
        googleService.Should().NotBeNull("Google OAuth service should be registered");
        googleService!.ProviderName.Should().Be("google", "Google OAuth service should have correct provider name");
    }

    [Fact]
    public void microsoft_oauth_service_should_have_correct_provider_name()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var oauthServices = scope.ServiceProvider.GetServices<IOAuthService>();
        var microsoftService = oauthServices.FirstOrDefault(s => (s is MicrosoftOAuthService));

        // Assert
        microsoftService.Should().NotBeNull("Microsoft OAuth service should be registered");
        microsoftService!.ProviderName.Should().Be("microsoft", "Microsoft OAuth service should have correct provider name");
    }

    [Fact]
    public void oauth_services_should_be_scoped_lifetime()
    {
        // Arrange & Act
        using var scope1 = _factory.Services.CreateScope();
        using var scope2 = _factory.Services.CreateScope();

        var oauthServices1 = scope1.ServiceProvider.GetServices<IOAuthService>().ToList();
        var oauthServices2 = scope2.ServiceProvider.GetServices<IOAuthService>().ToList();

        // Assert
        oauthServices1.Should().NotBeEmpty("OAuth services should be available in first scope");
        oauthServices2.Should().NotBeEmpty("OAuth services should be available in second scope");

        // Services should be different instances (scoped lifetime)
        for (int i = 0; i < oauthServices1.Count; i++)
        {
            oauthServices1[i].Should().NotBeSameAs(oauthServices2[i],
                "OAuth services should have scoped lifetime (different instances per scope)");
        }
    }

    [Fact]
    public void oauth_configs_should_be_singleton_lifetime()
    {
        // Arrange & Act
        using var scope1 = _factory.Services.CreateScope();
        using var scope2 = _factory.Services.CreateScope();

        var googleConfig1 = scope1.ServiceProvider.GetService<GoogleOAuthConfig>();
        var googleConfig2 = scope2.ServiceProvider.GetService<GoogleOAuthConfig>();

        var microsoftConfig1 = scope1.ServiceProvider.GetService<MicrosoftOAuthConfig>();
        var microsoftConfig2 = scope2.ServiceProvider.GetService<MicrosoftOAuthConfig>();

        // Assert
        googleConfig1.Should().BeSameAs(googleConfig2,
            "Google OAuth config should have singleton lifetime (same instance across scopes)");
        microsoftConfig1.Should().BeSameAs(microsoftConfig2,
            "Microsoft OAuth config should have singleton lifetime (same instance across scopes)");
    }

    [Fact]
    public void httpclient_should_be_registered_for_oauth_services()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var httpClientFactory = scope.ServiceProvider.GetService<IHttpClientFactory>();

        // Assert
        httpClientFactory.Should().NotBeNull("HttpClientFactory should be registered for OAuth services");

        // Verify we can create HttpClients for OAuth services
        var httpClient = httpClientFactory!.CreateClient();
        httpClient.Should().NotBeNull("HttpClient should be created for OAuth services");
    }

    [Fact]
    public void oauth_services_should_be_injectable_into_handlers()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var serviceProvider = scope.ServiceProvider;

        // Try to resolve all dependencies that OAuth handler needs
        var userRepository = serviceProvider.GetService<Application.Common.Interfaces.IUserRepository>();
        var emailHashingService = serviceProvider.GetService<IEmailHashingService>();
        var jwtTokenService = serviceProvider.GetService<IJwtTokenService>();
        var oauthServices = serviceProvider.GetServices<IOAuthService>();

        // Assert
        userRepository.Should().NotBeNull("User repository should be registered for OAuth handler");
        emailHashingService.Should().NotBeNull("Email hashing service should be registered for OAuth handler");
        jwtTokenService.Should().NotBeNull("JWT token service should be registered for OAuth handler");
        oauthServices.Should().NotBeEmpty("OAuth services should be registered for OAuth handler");
    }

    [Fact]
    public void oauth_services_should_support_provider_lookup()
    {
        // Arrange & Act
        using var scope = _factory.Services.CreateScope();
        var oauthServices = scope.ServiceProvider.GetServices<IOAuthService>();

        // Create a dictionary like the OAuth handler does
        var providerDictionary = oauthServices.ToDictionary(s => s.ProviderName, s => s, StringComparer.OrdinalIgnoreCase);

        // Assert
        providerDictionary.Should().ContainKey("google", "Google provider should be available in lookup");
        providerDictionary.Should().ContainKey("microsoft", "Microsoft provider should be available in lookup");
        providerDictionary.Should().ContainKey("GOOGLE", "Provider lookup should be case-insensitive");
        providerDictionary.Should().ContainKey("MICROSOFT", "Provider lookup should be case-insensitive");
    }
}
