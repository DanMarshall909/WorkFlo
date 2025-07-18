using System.Net;
using System.Text.Json;
using WorkFlo.Application.Auth.Services;
using WorkFlo.Infrastructure.Services.Auth;
using FluentAssertions;
using NSubstitute;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Infrastructure.Tests.Services.Auth;

/// <summary>
/// Tests for Google OAuth service implementation
/// Following TDD Red-Green-Refactor-Cover-Commit cycle
/// GitHub Issue #18: Privacy-First Authentication System
/// </summary>
public class GoogleOAuthServiceTests
{
    private readonly TestHttpMessageHandler _httpMessageHandler;
    private readonly HttpClient _httpClient;
    private readonly GoogleOAuthService _service;

    private readonly string _testAuthCode = "test_auth_code_123";
    private readonly string _testRedirectUri = "https://localhost:3000/auth/callback";
    private readonly string _testAccessToken = "google_access_token_123";
    private readonly string _testEmail = "test@example.com";
    private readonly string _testUserId = "google_user_123";
    private readonly string _testName = "Test User";

    public GoogleOAuthServiceTests()
    {
        _httpMessageHandler = new TestHttpMessageHandler();
        _httpClient = new HttpClient(_httpMessageHandler);

        // Mock GoogleOAuthService configuration
        var config = new GoogleOAuthConfig
        {
            ClientId = "test_client_id",
            ClientSecret = "test_client_secret",
            TokenEndpoint = "https://oauth2.googleapis.com/token",
            UserInfoEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo"
        };

        _service = new GoogleOAuthService(_httpClient, config);
    }

    [Fact]
    public void provider_name_is_google()
    {
        // Act & Assert
        _service.ProviderName.Should().Be("google");
    }

    [Fact]
    public async Task valid_authorization_code_returns_user_infoAsync()
    {
        // Arrange
        SetupSuccessfulTokenExchange();
        SetupSuccessfulUserInfoRetrieval();

        // Act
        var result = await _service.AuthenticateAsync(_testAuthCode, _testRedirectUri);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Email.Should().Be(_testEmail);
        result.Value.ProviderId.Should().Be(_testUserId);
        result.Value.Provider.Should().Be("google");
        result.Value.Name.Should().Be(_testName);
        result.Value.EmailVerified.Should().BeTrue();
    }

    [Fact]
    public async Task invalid_authorization_code_returns_failureAsync()
    {
        // Arrange
        SetupFailedTokenExchange();

        // Act
        var result = await _service.AuthenticateAsync("invalid_code", _testRedirectUri);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to exchange authorization code");
    }

    [Fact]
    public async Task token_exchange_http_error_returns_failureAsync()
    {
        // Arrange
        SetupHttpErrorResponse(HttpStatusCode.BadRequest);

        // Act
        var result = await _service.AuthenticateAsync(_testAuthCode, _testRedirectUri);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to exchange authorization code");
    }

    [Fact]
    public async Task user_info_retrieval_failure_returns_errorAsync()
    {
        // Arrange
        SetupSuccessfulTokenExchange();
        SetupFailedUserInfoRetrieval();

        // Act
        var result = await _service.AuthenticateAsync(_testAuthCode, _testRedirectUri);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to retrieve user information");
    }

    [Fact]
    public async Task null_redirect_uri_works_correctlyAsync()
    {
        // Arrange
        SetupSuccessfulTokenExchange();
        SetupSuccessfulUserInfoRetrieval();

        // Act
        var result = await _service.AuthenticateAsync(_testAuthCode, null);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Email.Should().Be(_testEmail);
    }

    [Fact]
    public async Task privacy_compliance_no_sensitive_data_loggedAsync()
    {
        // Arrange
        SetupSuccessfulTokenExchange();
        SetupSuccessfulUserInfoRetrieval();

        // Act
        var result = await _service.AuthenticateAsync(_testAuthCode, _testRedirectUri);

        // Assert
        result.IsSuccess.Should().BeTrue();

        // Verify that sensitive data is not exposed in any string representations
        var serviceString = _service.ToString();
        serviceString.Should().NotContain(_testEmail);
        serviceString.Should().NotContain(_testAccessToken);
        serviceString.Should().NotContain("test_client_secret");
    }

    [Fact]
    public async Task network_timeout_returns_appropriate_errorAsync()
    {
        // Arrange
        SetupTimeoutResponse();

        // Act
        var result = await _service.AuthenticateAsync(_testAuthCode, _testRedirectUri);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("timeout");
    }

    private void SetupSuccessfulTokenExchange()
    {
        var tokenResponse = new
        {
            access_token = _testAccessToken,
            token_type = "Bearer",
            expires_in = 3600
        };

        var tokenJson = JsonSerializer.Serialize(tokenResponse);
        var httpResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(tokenJson, System.Text.Encoding.UTF8, "application/json")
        };

        // Mock the token endpoint call
        _httpMessageHandler.SetResponse(req =>
            req.RequestUri!.ToString().Contains("oauth2.googleapis.com/token"), httpResponse);
    }

    private void SetupSuccessfulUserInfoRetrieval()
    {
        var userInfoResponse = new
        {
            id = _testUserId,
            email = _testEmail,
            verified_email = true,
            name = _testName,
            given_name = "Test",
            family_name = "User",
            picture = "https://example.com/avatar.jpg"
        };

        var userInfoJson = JsonSerializer.Serialize(userInfoResponse);
        var httpResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(userInfoJson, System.Text.Encoding.UTF8, "application/json")
        };

        // Mock the user info endpoint call
        _httpMessageHandler.SetResponse(req =>
            req.RequestUri!.ToString().Contains("googleapis.com/oauth2/v2/userinfo"), httpResponse);
    }

    private void SetupFailedTokenExchange()
    {
        var errorResponse = new
        {
            error = "invalid_grant",
            error_description = "Invalid authorization code"
        };

        var errorJson = JsonSerializer.Serialize(errorResponse);
        var httpResponse = new HttpResponseMessage(HttpStatusCode.BadRequest)
        {
            Content = new StringContent(errorJson, System.Text.Encoding.UTF8, "application/json")
        };

        _httpMessageHandler.SetResponse(req =>
            req.RequestUri!.ToString().Contains("oauth2.googleapis.com/token"), httpResponse);
    }

    private void SetupFailedUserInfoRetrieval()
    {
        var httpResponse = new HttpResponseMessage(HttpStatusCode.Unauthorized)
        {
            Content = new StringContent("Unauthorized", System.Text.Encoding.UTF8, "application/json")
        };

        _httpMessageHandler.SetResponse(req =>
            req.RequestUri!.ToString().Contains("googleapis.com/oauth2/v2/userinfo"), httpResponse);
    }

    private void SetupHttpErrorResponse(HttpStatusCode statusCode)
    {
        var httpResponse = new HttpResponseMessage(statusCode)
        {
            Content = new StringContent("Error", System.Text.Encoding.UTF8, "application/json")
        };

        _httpMessageHandler.SetDefaultResponse(httpResponse);
    }

    private void SetupTimeoutResponse()
    {
        _httpMessageHandler.SetException(new TaskCanceledException("Request timeout"));
    }
}

/// <summary>
/// Test HTTP message handler for mocking HTTP responses
/// </summary>
internal class TestHttpMessageHandler : HttpMessageHandler
{
    private readonly List<(Func<HttpRequestMessage, bool> predicate, HttpResponseMessage response)> _responses = new();
    private HttpResponseMessage? _defaultResponse;
    private Exception? _exception;

    public void SetResponse(Func<HttpRequestMessage, bool> predicate, HttpResponseMessage response)
    {
        _responses.Add((predicate, response));
    }

    public void SetDefaultResponse(HttpResponseMessage response)
    {
        _defaultResponse = response;
    }

    public void SetException(Exception exception)
    {
        _exception = exception;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (_exception != null)
        {
            return Task.FromException<HttpResponseMessage>(_exception);
        }

        // Find matching response
        foreach (var (predicate, response) in _responses)
        {
            if (predicate(request))
            {
                return Task.FromResult(response);
            }
        }

        // Return default response if no match found
        if (_defaultResponse != null)
        {
            return Task.FromResult(_defaultResponse);
        }

        // Return 404 if no response configured
        return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
    }
}
