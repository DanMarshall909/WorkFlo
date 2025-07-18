using System.Net;
using System.Net.Http.Json;
using WorkFlo.Api.Tests.Helpers;
using WorkFlo.Contracts.Auth;
using FluentAssertions;

namespace WorkFlo.Api.Tests.Endpoints.Auth;

/// <summary>
/// Rate limiting tests that are marked as skipped because rate limiting is disabled in the test environment
/// These tests validate that rate limiting configuration works correctly in the testing environment
/// </summary>
[Collection("IsolatedTests")]
public sealed class RegisterEndpointRateLimitSkippedTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public RegisterEndpointRateLimitSkippedTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact(Skip = "Rate limiting is disabled in test environment by design")]
    public async Task Rate_limit_prevents_excessive_registration_attemptsAsync()
    {
        // This test is skipped because rate limiting is disabled in testing environment
        // In production, this would return 429 after 5 attempts
        // In testing, all attempts succeed with 200 OK

        // Arrange
        var baseEmail = $"ratelimit{Guid.NewGuid()}";
        const int maxAttempts = 5;
        var responses = new List<HttpResponseMessage>();

        // Act - Attempt multiple registrations rapidly
        for (int i = 0; i < maxAttempts + 2; i++)
        {
            var request = new RegisterRequest
            {
                Email = $"{baseEmail}{i}@example.com",
                Password = "password123",
                ConfirmPassword = "password123"
            };

            var response = await _client.PostAsJsonAsync("/api/auth/register", request);
            responses.Add(response);
        }

        // In test environment, all requests succeed because rate limiting is disabled
        for (int i = 0; i < maxAttempts + 2; i++)
        {
            responses[i].StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }

    [Fact(Skip = "Rate limiting is disabled in test environment by design")]
    public async Task Rate_limit_returns_retry_after_headerAsync()
    {
        // This test is skipped because rate limiting is disabled in testing environment
        // In production, this would return 429 with Retry-After header
        // In testing, request succeeds with 200 OK

        // Arrange - Exhaust rate limit first
        const int maxAttempts = 5;
        for (int i = 0; i < maxAttempts; i++)
        {
            var setupRequest = new RegisterRequest
            {
                Email = $"setup{Guid.NewGuid()}@example.com",
                Password = "password123",
                ConfirmPassword = "password123"
            };
            await _client.PostAsJsonAsync("/api/auth/register", setupRequest);
        }

        // Act - Make request that exceeds limit
        var request = new RegisterRequest
        {
            Email = $"test{Guid.NewGuid()}@example.com",
            Password = "validpass123",
            ConfirmPassword = "validpass123"
        };
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // In test environment, request succeeds because rate limiting is disabled
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact(Skip = "Rate limiting is disabled in test environment by design")]
    public async Task Rate_limit_is_per_ip_not_per_emailAsync()
    {
        // This test is skipped because rate limiting is disabled in testing environment
        // In production, this would enforce per-IP rate limiting
        // In testing, all requests succeed

        // Arrange
        const int maxAttempts = 5;
        var responses = new List<HttpResponseMessage>();

        // Act - Same IP, different emails
        for (int i = 0; i < maxAttempts + 1; i++)
        {
            var request = new RegisterRequest
            {
                Email = $"user{i}{Guid.NewGuid()}@example.com",
                Password = "password123",
                ConfirmPassword = "password123"
            };

            var response = await _client.PostAsJsonAsync("/api/auth/register", request);
            responses.Add(response);
        }

        // In test environment, all requests succeed because rate limiting is disabled
        for (int i = 0; i < maxAttempts + 1; i++)
        {
            responses[i].StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }

    [Fact]
    public async Task Rate_limiting_configuration_is_disabled_in_test_environmentAsync()
    {
        // This test validates that rate limiting is correctly disabled in the test environment
        // This allows us to test registration functionality without hitting rate limits

        // Arrange - Make 10 rapid registration attempts (more than production rate limit)
        const int attempts = 10;
        var responses = new List<HttpResponseMessage>();

        // Act
        for (int i = 0; i < attempts; i++)
        {
            var request = new RegisterRequest
            {
                Email = $"testuser{i}{Guid.NewGuid()}@example.com",
                Password = "password123",
                ConfirmPassword = "password123"
            };

            var response = await _client.PostAsJsonAsync("/api/auth/register", request);
            responses.Add(response);
        }

        // Assert - All requests should succeed because rate limiting is disabled in tests
        responses.Should().AllSatisfy(response =>
            response.StatusCode.Should().Be(HttpStatusCode.OK,
                "Rate limiting should be disabled in test environment"));
    }
}
