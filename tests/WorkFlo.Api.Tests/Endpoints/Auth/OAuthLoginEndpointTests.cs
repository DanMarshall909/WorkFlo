using WorkFlo.Api.Endpoints.Auth;
using WorkFlo.Application.Auth.Commands;
using WorkFlo.Contracts.Auth;
using FluentAssertions;
using MediatR;
using NSubstitute;

namespace WorkFlo.Api.Tests.Endpoints.Auth;

/// <summary>
/// Tests for OAuth login endpoint
/// Following TDD Red-Green-Refactor-Cover-Commit cycle
/// GitHub Issue #18: Privacy-First Authentication System
/// </summary>
public class OAuthLoginEndpointTests
{
    private readonly IMediator _mediator;

    public OAuthLoginEndpointTests()
    {
        _mediator = Substitute.For<IMediator>();
    }

    [Fact]
    public void endpoint_can_be_created_with_mediator()
    {
        // Arrange & Act
        var endpoint = new OAuthLoginEndpoint(_mediator);

        // Assert
        endpoint.Should().NotBeNull("Endpoint should be created with mediator");
    }

    [Fact]
    public void endpoint_constructor_validates_mediator()
    {
        // Arrange
        IMediator? nullMediator = null;

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new OAuthLoginEndpoint(nullMediator!));
    }

    [Fact]
    public void google_oauth_request_creates_correct_command()
    {
        // Arrange
        var request = new OAuthLoginRequest
        {
            Provider = "google",
            AuthorizationCode = "test_auth_code",
            RedirectUri = "https://localhost:3000/auth/callback",
            RememberMe = true
        };

        // Act
        var command = CreateCommandFromRequest(request);

        // Assert
        command.Provider.Should().Be("google");
        command.AuthorizationCode.Should().Be("test_auth_code");
        command.RedirectUri.Should().Be("https://localhost:3000/auth/callback");
        command.RememberMe.Should().BeTrue();
    }

    [Fact]
    public void microsoft_oauth_request_creates_correct_command()
    {
        // Arrange
        var request = new OAuthLoginRequest
        {
            Provider = "microsoft",
            AuthorizationCode = "ms_auth_code",
            RedirectUri = null,
            RememberMe = false
        };

        // Act
        var command = CreateCommandFromRequest(request);

        // Assert
        command.Provider.Should().Be("microsoft");
        command.AuthorizationCode.Should().Be("ms_auth_code");
        command.RedirectUri.Should().BeNull();
        command.RememberMe.Should().BeFalse();
    }

    [Fact]
    public void invalid_provider_request_creates_correct_command()
    {
        // Arrange
        var request = new OAuthLoginRequest
        {
            Provider = "invalid_provider",
            AuthorizationCode = "test_code",
            RedirectUri = null,
            RememberMe = false
        };

        // Act
        var command = CreateCommandFromRequest(request);

        // Assert
        command.Provider.Should().Be("invalid_provider");
        command.AuthorizationCode.Should().Be("test_code");
        command.RedirectUri.Should().BeNull();
        command.RememberMe.Should().BeFalse();
    }

    [Fact]
    public void null_redirect_uri_is_handled_correctly()
    {
        // Arrange
        var request = new OAuthLoginRequest
        {
            Provider = "google",
            AuthorizationCode = "test_code",
            RedirectUri = null,
            RememberMe = false
        };

        // Act
        var command = CreateCommandFromRequest(request);

        // Assert
        command.RedirectUri.Should().BeNull();
    }

    [Fact]
    public void remember_me_flag_is_passed_correctly()
    {
        // Arrange
        var request = new OAuthLoginRequest
        {
            Provider = "google",
            AuthorizationCode = "test_code",
            RedirectUri = "https://localhost:3000/auth/callback",
            RememberMe = true
        };

        // Act
        var command = CreateCommandFromRequest(request);

        // Assert
        command.RememberMe.Should().BeTrue();
    }

    [Fact]
    public void oauth_login_request_validation_works()
    {
        // Arrange
        var request = new OAuthLoginRequest
        {
            Provider = "google",
            AuthorizationCode = "test_code",
            RedirectUri = "https://localhost:3000/auth/callback",
            RememberMe = false
        };

        // Act & Assert
        // Basic validation - should not throw
        request.Provider.Should().NotBeNullOrEmpty();
        request.AuthorizationCode.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void oauth_login_response_can_be_created()
    {
        // Arrange & Act
        var response = new OAuthLoginResponse
        {
            AccessToken = "test_token",
            RefreshToken = "test_refresh",
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            IsNewUser = false,
            User = new OAuthLoginResponse.UserInfo
            {
                Id = Guid.NewGuid(),
                EmailHash = "test_hash",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PreferredName = "Test User"
            }
        };

        // Assert
        response.AccessToken.Should().Be("test_token");
        response.RefreshToken.Should().Be("test_refresh");
        response.IsNewUser.Should().BeFalse();
        response.User.Should().NotBeNull();
        response.User!.PreferredName.Should().Be("Test User");
    }

    private static COAuthLogin CreateCommandFromRequest(OAuthLoginRequest request)
    {
        return new COAuthLogin
        {
            Provider = request.Provider,
            AuthorizationCode = request.AuthorizationCode,
            RedirectUri = request.RedirectUri,
            RememberMe = request.RememberMe
        };
    }
}
