using System.Net;
using System.Text.Json;
using WorkFlo.Application.Auth.Services;
using WorkFlo.Infrastructure.Services.Auth;
using FluentAssertions;
using NSubstitute;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Infrastructure.Tests.Services.Auth;

/// <summary>
/// Tests for Microsoft OAuth service implementation
/// Following TDD Red-Green-Refactor-Cover-Commit cycle
/// GitHub Issue #18: Privacy-First Authentication System
/// </summary>
public class MicrosoftOAuthServiceTests
{
    private readonly TestHttpMessageHandler _httpMessageHandler;
    private readonly HttpClient _httpClient;
    private readonly MicrosoftOAuthService _service;

    private readonly string _testAuthCode = "test_ms_auth_code_123";
    private readonly string _testRedirectUri = "https://localhost:3000/auth/callback";
    private readonly string _testAccessToken = "microsoft_access_token_123";
    private readonly string _testEmail = "test@example.com";
    private readonly string _testUserId = "microsoft_user_123";
    private readonly string _testName = "Test User";

    public MicrosoftOAuthServiceTests()
    {
        _httpMessageHandler = new TestHttpMessageHandler();
        _httpClient = new HttpClient(_httpMessageHandler);

        // Mock MicrosoftOAuthService configuration
        var config = new MicrosoftOAuthConfig
        {
            ClientId = "test_client_id",
            ClientSecret = "test_client_secret",
            TokenEndpoint = "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            UserInfoEndpoint = "https://graph.microsoft.com/v1.0/me"
        };

        _service = new MicrosoftOAuthService(_httpClient, config);
    }

    [Fact]
    public void provider_name_is_microsoft()
    {
        // Act & Assert
        _service.ProviderName.Should().Be("microsoft");
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
        result.Value.Provider.Should().Be("microsoft");
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
            expires_in = 3600,
            scope = "openid profile email"
        };

        var tokenJson = JsonSerializer.Serialize(tokenResponse);
        var httpResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(tokenJson, System.Text.Encoding.UTF8, "application/json")
        };

        // Mock the token endpoint call
        _httpMessageHandler.SetResponse(req =>
            req.RequestUri!.ToString().Contains("login.microsoftonline.com"), httpResponse);
    }

    private void SetupSuccessfulUserInfoRetrieval()
    {
        var userInfoResponse = new
        {
            id = _testUserId,
            mail = _testEmail,
            displayName = _testName,
            givenName = "Test",
            surname = "User",
            userPrincipalName = _testEmail
        };

        var userInfoJson = JsonSerializer.Serialize(userInfoResponse);
        var httpResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(userInfoJson, System.Text.Encoding.UTF8, "application/json")
        };

        // Mock the user info endpoint call
        _httpMessageHandler.SetResponse(req =>
            req.RequestUri!.ToString().Contains("graph.microsoft.com"), httpResponse);
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
            req.RequestUri!.ToString().Contains("login.microsoftonline.com"), httpResponse);
    }

    private void SetupFailedUserInfoRetrieval()
    {
        var httpResponse = new HttpResponseMessage(HttpStatusCode.Unauthorized)
        {
            Content = new StringContent("Unauthorized", System.Text.Encoding.UTF8, "application/json")
        };

        _httpMessageHandler.SetResponse(req =>
            req.RequestUri!.ToString().Contains("graph.microsoft.com"), httpResponse);
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
