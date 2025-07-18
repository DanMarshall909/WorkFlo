using System.Net;
using WorkFlo.Api.Tests.Helpers;
using WorkFlo.Contracts.Auth;
using FluentAssertions;

namespace WorkFlo.Api.Tests.Endpoints.Auth;

/// <summary>
/// Clean integration tests for registration endpoint following Ardalis patterns
/// Tests the full API pipeline without external dependencies
/// </summary>
[Collection("IsolatedTests")]
public sealed class RegisterEndpointTestsClean : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RegisterEndpointTestsClean(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Should_register_user_with_valid_passwordAsync()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = $"test{Guid.NewGuid()}@example.com",
            Password = "ValidTestPassword123!",
            ConfirmPassword = "ValidTestPassword123!"
        };

        // Act
        var result = await _client.PostAndEnsureSuccessAsync<AuthResponse>("/api/auth/register", request);

        // Assert - With email verification flow, tokens are null until email is verified
        result.AccessToken.Should().BeNull();
        result.RefreshToken.Should().BeNull();
        result.User.Should().NotBeNull();
        result.ExpiresAt.Should().BeNull();
    }

    [Fact]
    public Task Should_reject_empty_emailAsync()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "",
            Password = "ValidTestPassword123!",
            ConfirmPassword = "ValidTestPassword123!"
        };

        // Act & Assert
        return _client.PostAndEnsureBadRequestAsync("/api/auth/register", request);
    }

    [Fact]
    public Task Should_reject_invalid_email_formatAsync()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "invalid-email-format",
            Password = "ValidTestPassword123!",
            ConfirmPassword = "ValidTestPassword123!"
        };

        // Act & Assert
        return _client.PostAndEnsureBadRequestAsync("/api/auth/register", request);
    }

    [Fact]
    public Task Should_reject_password_shorter_than_8_charactersAsync()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = $"test{Guid.NewGuid()}@example.com",
            Password = "short",
            ConfirmPassword = "short"
        };

        // Act & Assert
        return _client.PostAndEnsureBadRequestAsync("/api/auth/register", request);
    }

    [Fact]
    public Task Should_reject_mismatched_passwordsAsync()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = $"test{Guid.NewGuid()}@example.com",
            Password = "ValidTestPassword123!",
            ConfirmPassword = "different456"
        };

        // Act & Assert
        return _client.PostAndEnsureBadRequestAsync("/api/auth/register", request);
    }

    [Fact]
    public Task Should_reject_empty_passwordAsync()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = $"test{Guid.NewGuid()}@example.com",
            Password = "",
            ConfirmPassword = ""
        };

        // Act & Assert
        return _client.PostAndEnsureBadRequestAsync("/api/auth/register", request);
    }

    [Fact]
    public async Task Should_reject_duplicate_email_registrationAsync()
    {
        // Arrange
        var email = $"duplicate{Guid.NewGuid()}@example.com";
        var firstRequest = new RegisterRequest
        {
            Email = email,
            Password = "ValidTestPassword123!",
            ConfirmPassword = "ValidTestPassword123!"
        };
        var duplicateRequest = new RegisterRequest
        {
            Email = email,
            Password = "DifferentPass456!",
            ConfirmPassword = "DifferentPass456!"
        };

        // Act - First registration should succeed
        await _client.PostAndEnsureSuccessAsync<AuthResponse>("/api/auth/register", firstRequest);

        // Act & Assert - Second registration should fail
        await _client.PostAndEnsureBadRequestAsync("/api/auth/register", duplicateRequest);
    }
}
