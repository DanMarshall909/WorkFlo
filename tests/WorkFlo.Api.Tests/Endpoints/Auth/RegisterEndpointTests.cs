using System.Net;
using System.Net.Http.Json;
using WorkFlo.Api.Tests.Helpers;
using WorkFlo.Application.Auth.Services;
using WorkFlo.Contracts.Auth;
using WorkFlo.Infrastructure.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace WorkFlo.Api.Tests.Endpoints.Auth;


[Collection("IsolatedTests")]
public sealed class RegisterEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public RegisterEndpointTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task Should_register_user_with_valid_8_character_passwordAsync()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = $"test{Guid.NewGuid()}@example.com",
            Password = "ValidTestPassword123!",
            ConfirmPassword = "ValidTestPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<AuthResponse>();
        content.Should().NotBeNull();
        // With email verification flow, tokens are null until email is verified
        content!.AccessToken.Should().BeNull();
        content.RefreshToken.Should().BeNull();
        content.ExpiresAt.Should().BeNull();
    }

    [Fact]
    public async Task Should_accept_simple_passwords_without_complexity_requirementsAsync()
    {
        // Arrange - Use simple passwords that are NOT in the breached password list
        var testCases = new[]
        {
            "validlow8",  // All lowercase, not breached
            "VALIDUP8",   // All uppercase, not breached
            "98765432",   // All numbers, not breached
            "simple99",   // Simple alphanumeric, not breached
            "goodpass"    // Simple repeated pattern, not breached
        };

        foreach (var password in testCases)
        {
            var request = new RegisterRequest
            {
                Email = $"test{Guid.NewGuid()}@example.com",
                Password = password,
                ConfirmPassword = password
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/auth/register", request);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK,
                $"Password '{password}' should be accepted");
        }
    }

    [Fact]
    public async Task Should_reject_password_shorter_than_8_charactersAsync()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = $"test{Guid.NewGuid()}@example.com",
            Password = "short",
            ConfirmPassword = "short"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Password must be at least 8 characters long");
    }

    [Fact]
    public async Task Should_reject_empty_passwordAsync()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = $"test{Guid.NewGuid()}@example.com",
            Password = "",
            ConfirmPassword = ""
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Password is required");
    }

    [Fact]
    public async Task Should_reject_mismatched_passwordsAsync()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = $"test{Guid.NewGuid()}@example.com",
            Password = "password123",
            ConfirmPassword = "different123"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Passwords do not match");
    }

    [Fact]
    public async Task Should_reject_invalid_email_formatAsync()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "invalid-email",
            Password = "validpass123",
            ConfirmPassword = "validpass123"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Please provide a valid email address");
    }

    [Fact]
    public async Task Should_reject_empty_emailAsync()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "",
            Password = "validpass123",
            ConfirmPassword = "validpass123"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Email is required");
    }

    [Fact]
    public async Task Should_reject_duplicate_email_registrationAsync()
    {
        // Arrange
        var email = $"duplicate{Guid.NewGuid()}@example.com";
        var request = new RegisterRequest
        {
            Email = email,
            Password = "validpass123",
            ConfirmPassword = "validpass123"
        };

        // Register once
        var firstResponse = await _client.PostAsJsonAsync("/api/auth/register", request);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Act - Try to register again with same email
        var secondResponse = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        secondResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await secondResponse.Content.ReadAsStringAsync();
        content.Should().Contain("registration"); // FastEndpoints error format
    }

    [Fact]
    public async Task Should_handle_exactly_8_character_passwordAsync()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = $"test{Guid.NewGuid()}@example.com",
            Password = "12345678",
            ConfirmPassword = "12345678"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadFromJsonAsync<AuthResponse>();
        content.Should().NotBeNull();
        // With email verification flow, tokens are null until email is verified
        content!.AccessToken.Should().BeNull();
    }

    [Fact]
    public async Task Should_reject_null_requestAsync()
    {
        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", (RegisterRequest?)null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
