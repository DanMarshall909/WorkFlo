using WorkFlo.Application.Auth.Commands;
using WorkFlo.Application.Auth.Services;
using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Users;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Application.Tests.Auth.Commands;

/// <summary>
/// Security-focused tests for OAuth login command handler
/// Following TDD Red-Green-Refactor-Cover-Commit cycle
/// GitHub Issue #18: Privacy-First Authentication System
/// </summary>
public class HOAuthLoginTests
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailHashingService _emailHashingService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IOAuthService _googleOAuthService;
    private readonly IOAuthService _microsoftOAuthService;
    private readonly HOAuthLogin _handler;

    private readonly string _testEmail = "test@example.com";
    private readonly string _testEmailHash = "hashed_email_123";
    private readonly string _testAuthCode = "auth_code_123";
    private readonly string _testRedirectUri = "https://localhost:3000/auth/callback";
    private readonly string _testProviderId = "google_user_123";
    private readonly string _testAccessToken = "access_token_123";
    private readonly string _testRefreshToken = "refresh_token_123";
    private readonly DateTime _testExpiresAt = DateTime.UtcNow.AddDays(7);

    public HOAuthLoginTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _emailHashingService = Substitute.For<IEmailHashingService>();
        _jwtTokenService = Substitute.For<IJwtTokenService>();
        _googleOAuthService = Substitute.For<IOAuthService>();
        _microsoftOAuthService = Substitute.For<IOAuthService>();

        // Configure OAuth services
        _googleOAuthService.ProviderName.Returns("google");
        _microsoftOAuthService.ProviderName.Returns("microsoft");

        var oauthServices = new[] { _googleOAuthService, _microsoftOAuthService };

        _handler = new HOAuthLogin(
            _userRepository,
            _emailHashingService,
            _jwtTokenService,
            oauthServices
        );
    }

    [Fact]
    public async Task existing_google_user_can_login_successfullyAsync()
    {
        // Arrange
        var request = new COAuthLogin
        {
            Provider = "google",
            AuthorizationCode = _testAuthCode,
            RedirectUri = _testRedirectUri
        };

        var oauthUserInfo = new OAuthUserInfo
        {
            Email = _testEmail,
            ProviderId = _testProviderId,
            Provider = "google",
            EmailVerified = true
        };

        var existingUser = CreateTestUser();

        SetupMocksForSuccessfulOAuthLogin(oauthUserInfo, existingUser);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.AccessToken.Should().Be(_testAccessToken);
        result.Value.RefreshToken.Should().Be(_testRefreshToken);
        result.Value.User.Id.Should().NotBeEmpty();
        result.Value.User.EmailHash.Should().Be(_testEmailHash);
        result.Value.IsNewUser.Should().BeFalse();
    }

    [Fact]
    public async Task new_google_user_is_created_and_logged_inAsync()
    {
        // Arrange
        var request = new COAuthLogin
        {
            Provider = "google",
            AuthorizationCode = _testAuthCode,
            RedirectUri = _testRedirectUri
        };

        var oauthUserInfo = new OAuthUserInfo
        {
            Email = _testEmail,
            ProviderId = _testProviderId,
            Provider = "google",
            Name = "Test User",
            EmailVerified = true
        };

        _googleOAuthService.AuthenticateAsync(_testAuthCode, _testRedirectUri, Arg.Any<CancellationToken>())
            .Returns(Success(oauthUserInfo));

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);

        // User doesn't exist
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns((User?)null);

        // Setup user creation and token generation
        var newUser = CreateTestUser();
        _userRepository.AddAsync(Arg.Any<User>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        SetupJwtTokenGeneration(newUser);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsNewUser.Should().BeTrue();
        result.Value.User.PreferredName.Should().Be("Test User");

        // Verify user was created
        await _userRepository.Received(1).AddAsync(
            Arg.Is<User>(u => u.EmailHash == _testEmailHash),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task invalid_oauth_provider_fails_loginAsync()
    {
        // Arrange
        var request = new COAuthLogin
        {
            Provider = "invalid-provider",
            AuthorizationCode = _testAuthCode
        };

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Unsupported OAuth provider: invalid-provider");
    }

    [Fact]
    public async Task oauth_authentication_failure_returns_errorAsync()
    {
        // Arrange
        var request = new COAuthLogin
        {
            Provider = "google",
            AuthorizationCode = "invalid_code"
        };

        _googleOAuthService.AuthenticateAsync("invalid_code", null, Arg.Any<CancellationToken>())
            .Returns(Failure<OAuthUserInfo>("Invalid authorization code"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid authorization code");
    }

    [Fact]
    public async Task oauth_service_exception_returns_failureAsync()
    {
        // Arrange
        var request = new COAuthLogin
        {
            Provider = "google",
            AuthorizationCode = _testAuthCode
        };

        _googleOAuthService.AuthenticateAsync(_testAuthCode, null, Arg.Any<CancellationToken>())
            .Throws(new InvalidOperationException("OAuth service unavailable"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to authenticate with OAuth provider");
        result.Error.Should().Contain("OAuth service unavailable");
    }

    [Fact]
    public async Task remember_me_affects_token_expiry_for_oauthAsync()
    {
        // Arrange
        var request = new COAuthLogin
        {
            Provider = "google",
            AuthorizationCode = _testAuthCode,
            RememberMe = true
        };

        var oauthUserInfo = new OAuthUserInfo
        {
            Email = _testEmail,
            ProviderId = _testProviderId,
            Provider = "google",
            EmailVerified = true
        };

        var existingUser = CreateTestUser();
        var extendedExpiresAt = DateTime.UtcNow.AddDays(30);

        // Setup OAuth authentication
        _googleOAuthService.AuthenticateAsync(_testAuthCode, null, Arg.Any<CancellationToken>())
            .Returns(Success(oauthUserInfo));

        // Setup user lookup
        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(existingUser);

        // Setup JWT generation with remember me = true
        _jwtTokenService.GenerateAccessTokenAsync(existingUser.Id, existingUser.EmailHash, Arg.Any<CancellationToken>())
            .Returns(_testAccessToken);
        _jwtTokenService.GenerateRefreshTokenAsync(existingUser.Id, Arg.Any<CancellationToken>())
            .Returns(_testRefreshToken);
        _jwtTokenService.GetTokenExpiryTime(true).Returns(extendedExpiresAt);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.ExpiresAt.Should().Be(extendedExpiresAt);
        _jwtTokenService.Received(1).GetTokenExpiryTime(true);
    }

    [Fact]
    public async Task microsoft_oauth_provider_works_correctlyAsync()
    {
        // Arrange
        var request = new COAuthLogin
        {
            Provider = "microsoft",
            AuthorizationCode = _testAuthCode
        };

        var oauthUserInfo = new OAuthUserInfo
        {
            Email = _testEmail,
            ProviderId = "microsoft_user_123",
            Provider = "microsoft",
            EmailVerified = true
        };

        var existingUser = CreateTestUser();

        _microsoftOAuthService.AuthenticateAsync(_testAuthCode, null, Arg.Any<CancellationToken>())
            .Returns(Success(oauthUserInfo));

        SetupMocksForUserLookupAndTokenGeneration(existingUser);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        _microsoftOAuthService.Received(1).AuthenticateAsync(_testAuthCode, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task privacy_first_no_pii_stored_without_consentAsync()
    {
        // Arrange
        var request = new COAuthLogin
        {
            Provider = "google",
            AuthorizationCode = _testAuthCode
        };

        var oauthUserInfo = new OAuthUserInfo
        {
            Email = _testEmail,
            ProviderId = _testProviderId,
            Provider = "google",
            Name = "Sensitive Name", // This should not be stored without consent
            EmailVerified = true
        };

        _googleOAuthService.AuthenticateAsync(_testAuthCode, null, Arg.Any<CancellationToken>())
            .Returns(Success(oauthUserInfo));

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);

        // User doesn't exist - will be created
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns((User?)null);

        var newUser = CreateTestUser();
        _userRepository.AddAsync(Arg.Any<User>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        SetupJwtTokenGeneration(newUser);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        // Verify that PII is not stored in the domain - only hashed email
        await _userRepository.Received(1).AddAsync(
            Arg.Is<User>(u =>
                u.EmailHash == _testEmailHash &&
                !u.ToString().Contains("Sensitive Name") && // No PII in string representation
                !u.ToString().Contains(_testEmail)), // No plain email
            Arg.Any<CancellationToken>());
    }

    private User CreateTestUser()
    {
        // OAuth users still need some password hash for the domain model, use placeholder
        var userResult = User.Create(_testEmailHash, "oauth_placeholder_hash");
        return userResult.Value!;
    }

    private void SetupMocksForSuccessfulOAuthLogin(OAuthUserInfo oauthUserInfo, User existingUser)
    {
        _googleOAuthService.AuthenticateAsync(_testAuthCode, _testRedirectUri, Arg.Any<CancellationToken>())
            .Returns(Success(oauthUserInfo));

        SetupMocksForUserLookupAndTokenGeneration(existingUser);
    }

    private void SetupMocksForUserLookupAndTokenGeneration(User user)
    {
        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(user);

        SetupJwtTokenGeneration(user);
    }

    private void SetupJwtTokenGeneration(User user)
    {
        _jwtTokenService.GenerateAccessTokenAsync(user.Id, user.EmailHash, Arg.Any<CancellationToken>())
            .Returns(_testAccessToken);
        _jwtTokenService.GenerateRefreshTokenAsync(user.Id, Arg.Any<CancellationToken>())
            .Returns(_testRefreshToken);
        _jwtTokenService.GetTokenExpiryTime(false)
            .Returns(_testExpiresAt);
    }
}
