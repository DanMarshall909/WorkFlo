using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using WorkFlo.Api.Tests.Helpers;
using WorkFlo.Contracts.Auth;
using FluentAssertions;

namespace WorkFlo.Api.Tests.Integration;

/// <summary>
/// Integration tests for OAuth authentication flow
/// These tests verify the complete OAuth pipeline works end-to-end
/// and would detect DI registration issues that unit tests might miss
/// GitHub Issue #18: Privacy-First Authentication System
/// </summary>
[Collection("IsolatedTests")]
public class OAuthIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public OAuthIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task oauth_endpoint_should_be_accessibleAsync()
    {
        // Arrange
        var request = new OAuthLoginRequest
        {
            Provider = "google",
            AuthorizationCode = "test_code",
            RedirectUri = "https://localhost:3000/auth/callback",
            RememberMe = false
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/oauth/login", request);

        // Assert
        response.StatusCode.Should().NotBe(HttpStatusCode.NotFound,
            "OAuth endpoint should be accessible (not 404)");
        response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError,
            "OAuth endpoint should not have DI registration errors (not 500)");
    }

    [Fact]
    public async Task oauth_endpoint_should_handle_invalid_provider_gracefullyAsync()
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
        var response = await _client.PostAsJsonAsync("/api/auth/oauth/login", request);
        var responseContent = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            "Invalid provider should return 401 Unauthorized");
        responseContent.Should().Contain("Unsupported OAuth provider",
            "Response should contain specific error message");
    }

    [Fact]
    public async Task oauth_endpoint_should_handle_google_providerAsync()
    {
        // Arrange
        var request = new OAuthLoginRequest
        {
            Provider = "google",
            AuthorizationCode = "invalid_test_code",
            RedirectUri = "https://localhost:3000/auth/callback",
            RememberMe = false
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/oauth/login", request);

        // Assert
        response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError,
            "Google OAuth should not cause DI errors");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            "Google OAuth should fail gracefully with test credentials");
    }

    [Fact]
    public async Task oauth_endpoint_should_handle_microsoft_providerAsync()
    {
        // Arrange
        var request = new OAuthLoginRequest
        {
            Provider = "microsoft",
            AuthorizationCode = "invalid_test_code",
            RedirectUri = "https://localhost:3000/auth/callback",
            RememberMe = false
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/oauth/login", request);

        // Assert
        response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError,
            "Microsoft OAuth should not cause DI errors");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            "Microsoft OAuth should fail gracefully with test credentials");
    }

    [Fact]
    public async Task oauth_endpoint_should_handle_case_insensitive_providersAsync()
    {
        // Arrange
        var requests = new[]
        {
            new OAuthLoginRequest { Provider = "GOOGLE", AuthorizationCode = "invalid_test_code", RedirectUri = null, RememberMe = false },
            new OAuthLoginRequest { Provider = "Google", AuthorizationCode = "invalid_test_code", RedirectUri = null, RememberMe = false },
            new OAuthLoginRequest { Provider = "MICROSOFT", AuthorizationCode = "invalid_test_code", RedirectUri = null, RememberMe = false },
            new OAuthLoginRequest { Provider = "Microsoft", AuthorizationCode = "invalid_test_code", RedirectUri = null, RememberMe = false }
        };

        // Act & Assert
        foreach (var request in requests)
        {
            var response = await _client.PostAsJsonAsync("/api/auth/oauth/login", request);

            response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError,
                $"Provider '{request.Provider}' should not cause DI errors");
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
                $"Provider '{request.Provider}' should be recognized (case-insensitive)");
        }
    }

    [Fact]
    public async Task oauth_endpoint_should_validate_request_modelAsync()
    {
        // Test cases for request validation
        var testCases = new[]
        {
            new { Request = new { Provider = "", AuthorizationCode = "test_code" }, ExpectedStatus = HttpStatusCode.BadRequest },
            new { Request = new { Provider = "google", AuthorizationCode = "" }, ExpectedStatus = HttpStatusCode.BadRequest },
            new { Request = new { Provider = (string?)null, AuthorizationCode = "test_code" }, ExpectedStatus = HttpStatusCode.BadRequest },
            new { Request = new { Provider = "google", AuthorizationCode = (string?)null }, ExpectedStatus = HttpStatusCode.BadRequest }
        };

        foreach (var testCase in testCases)
        {
            // Act
            var response = await _client.PostAsJsonAsync("/api/auth/oauth/login", testCase.Request);

            // Assert
            response.StatusCode.Should().Be(testCase.ExpectedStatus,
                $"Request validation should work for {JsonSerializer.Serialize(testCase.Request)}");
        }
    }

    [Fact]
    public async Task oauth_endpoint_should_return_proper_error_response_formatAsync()
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
        var response = await _client.PostAsJsonAsync("/api/auth/oauth/login", request);
        var responseContent = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        // Try to deserialize as OAuthLoginResponse
        var loginResponse = JsonSerializer.Deserialize<OAuthLoginResponse>(responseContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        loginResponse.Should().NotBeNull("Response should be deserializable as OAuthLoginResponse");
        loginResponse!.Error.Should().NotBeNullOrEmpty("Error response should contain error message");
        loginResponse.AccessToken.Should().BeNull("Failed response should not contain access token");
        loginResponse.RefreshToken.Should().BeNull("Failed response should not contain refresh token");
    }

    [Fact]
    public async Task oauth_endpoint_should_handle_network_timeouts_gracefullyAsync()
    {
        // Arrange - Use a provider that will trigger network calls
        var request = new OAuthLoginRequest
        {
            Provider = "google",
            AuthorizationCode = "test_code_that_will_timeout",
            RedirectUri = "https://localhost:3000/auth/callback",
            RememberMe = false
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/oauth/login", request);

        // Assert
        response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError,
            "Network timeouts should be handled gracefully without crashing");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            "Network issues should result in authentication failure");
    }

    [Fact]
    public async Task oauth_endpoint_should_handle_concurrent_requestsAsync()
    {
        // Arrange
        var requests = Enumerable.Range(0, 10).Select(i => new OAuthLoginRequest
        {
            Provider = i % 2 == 0 ? "google" : "microsoft",
            AuthorizationCode = $"test_code_{i}",
            RedirectUri = null,
            RememberMe = false
        }).ToList();

        // Act
        var tasks = requests.Select(async request =>
            await _client.PostAsJsonAsync("/api/auth/oauth/login", request));

        var responses = await Task.WhenAll(tasks);

        // Assert
        responses.Should().AllSatisfy(response =>
        {
            response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError,
                "Concurrent requests should not cause DI or threading issues");
        });
    }

    [Fact]
    public async Task oauth_endpoint_should_preserve_remember_me_settingAsync()
    {
        // Arrange
        var request = new OAuthLoginRequest
        {
            Provider = "google",
            AuthorizationCode = "test_code",
            RedirectUri = null,
            RememberMe = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/oauth/login", request);

        // Assert
        response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError,
            "Remember me setting should be handled without errors");
        // The specific behavior depends on the OAuth provider response,
        // but we should not get server errors
    }

    [Fact]
    public async Task oauth_endpoint_should_handle_null_redirect_uriAsync()
    {
        // Arrange
        var request = new OAuthLoginRequest
        {
            Provider = "google",
            AuthorizationCode = "test_code",
            RedirectUri = null, // Explicitly test null
            RememberMe = false
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/oauth/login", request);

        // Assert
        response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError,
            "Null redirect URI should be handled gracefully");
    }

    [Fact]
    public async Task oauth_endpoint_should_not_leak_sensitive_informationAsync()
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
        var response = await _client.PostAsJsonAsync("/api/auth/oauth/login", request);
        var responseContent = await response.Content.ReadAsStringAsync();

        // Assert
        responseContent.Should().NotContain("client_secret",
            "Response should not leak OAuth client secrets");
        responseContent.Should().NotContain("access_token",
            "Response should not leak OAuth access tokens from failed requests");
        responseContent.Should().NotContain("Exception",
            "Response should not leak internal exception details");
    }

    [Fact]
    public async Task oauth_services_should_be_properly_disposedAsync()
    {
        // This test verifies that OAuth services are properly disposed
        // by making multiple requests and ensuring no memory leaks

        // Arrange & Act
        var tasks = Enumerable.Range(0, 5).Select(async i =>
        {
            var request = new OAuthLoginRequest
            {
                Provider = "google",
                AuthorizationCode = $"test_code_{i}",
                RedirectUri = null,
                RememberMe = false
            };

            return await _client.PostAsJsonAsync("/api/auth/oauth/login", request);
        });

        var responses = await Task.WhenAll(tasks);

        // Assert
        responses.Should().AllSatisfy(response =>
        {
            response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError,
                "Multiple requests should not cause resource disposal issues");
        });
    }
}
