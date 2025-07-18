using WorkFlo.Application.Auth.Commands;
using WorkFlo.Application.Auth.Services;
using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Users;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace WorkFlo.Application.Tests.Auth.Commands;

/// <summary>
/// Security-focused tests for login command handler
/// Following TDD Red-Green-Refactor-Cover-Commit cycle
/// GitHub Issue #57: Authentication Command Handler Tests
/// </summary>
public class HLoginUserTests
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHashingService _passwordHashingService;
    private readonly IEmailHashingService _emailHashingService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly HLoginUser _handler;

    private readonly string _testEmail = "test@example.com";
    private readonly string _testPassword = "TestPassword123!";
    private readonly string _testEmailHash = "hashed_email_123";
    private readonly string _testPasswordHash = "hashed_password_123";
    private readonly string _testAccessToken = "access_token_123";
    private readonly string _testRefreshToken = "refresh_token_123";
    private readonly DateTime _testExpiresAt = DateTime.UtcNow.AddDays(7);

    public HLoginUserTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _passwordHashingService = Substitute.For<IPasswordHashingService>();
        _emailHashingService = Substitute.For<IEmailHashingService>();
        _jwtTokenService = Substitute.For<IJwtTokenService>();

        _handler = new HLoginUser(
            _userRepository,
            _passwordHashingService,
            _emailHashingService,
            _jwtTokenService
        );
    }

    [Fact]
    public async Task valid_user_can_login_successfullyAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword };
        var user = CreateTestUser();

        SetupMocksForSuccessfulLogin(user);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.AccessToken.Should().Be(_testAccessToken);
        result.Value.RefreshToken.Should().Be(_testRefreshToken);
        result.Value.User.Id.Should().NotBeEmpty();
        result.Value.User.EmailHash.Should().Be(_testEmailHash);
    }

    [Fact]
    public async Task nonexistent_user_fails_loginAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword };

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns((User?)null);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid email or password");
    }

    [Fact]
    public async Task incorrect_password_fails_loginAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = "WrongPassword" };
        var user = CreateTestUser();

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(user);
        _passwordHashingService.VerifyPassword("WrongPassword", _testPasswordHash)
            .Returns(false);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid email or password");
    }

    [Fact]
    public async Task inactive_user_fails_loginAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword };
        var user = CreateTestUser();
        user.Deactivate(); // Make user inactive

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(user);
        _passwordHashingService.VerifyPassword(_testPassword, _testPasswordHash)
            .Returns(true);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("User account is deactivated");
    }

    [Fact]
    public Task null_request_throws_exceptionAsync()
    {
        // Act & Assert
        return FluentActions.Invoking(() => _handler.Handle(null!, CancellationToken.None))
            .Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task remember_me_affects_token_expiryAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword, RememberMe = true };
        var user = CreateTestUser();
        var extendedExpiresAt = DateTime.UtcNow.AddDays(30);

        SetupMocksForSuccessfulLogin(user);
        _jwtTokenService.GetTokenExpiryTime(true).Returns(extendedExpiresAt);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.ExpiresAt.Should().Be(extendedExpiresAt);
        _jwtTokenService.Received(1).GetTokenExpiryTime(true);
    }

    [Fact]
    public async Task email_hashing_service_exception_returns_failureAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword };

        _emailHashingService.HashEmail(_testEmail)
            .Throws(new InvalidOperationException("Email hashing failed"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to login user");
        result.Error.Should().Contain("Email hashing failed");
    }

    [Fact]
    public async Task user_repository_exception_returns_failureAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword };

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Throws(new InvalidOperationException("Database connection failed"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to login user");
        result.Error.Should().Contain("Database connection failed");
    }

    [Fact]
    public async Task jwt_token_service_exception_returns_failureAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword };
        var user = CreateTestUser();

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(user);
        _passwordHashingService.VerifyPassword(_testPassword, _testPasswordHash)
            .Returns(true);
        _jwtTokenService.GenerateAccessTokenAsync(user.Id, user.EmailHash, Arg.Any<CancellationToken>())
            .Throws(new InvalidOperationException("JWT generation failed"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to login user");
        result.Error.Should().Contain("JWT generation failed");
    }

    [Fact]
    public Task cancellation_token_is_respectedAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword };
        var cancellationToken = new CancellationToken(canceled: true);

        // Act & Assert
        return FluentActions.Invoking(() => _handler.Handle(request, cancellationToken))
            .Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task login_calls_services_in_correct_orderAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword };
        var user = CreateTestUser();
        var callOrder = new List<string>();

        _emailHashingService.HashEmail(_testEmail)
            .Returns(_testEmailHash)
            .AndDoes(x => callOrder.Add("HashEmail"));

        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(user)
            .AndDoes(x => callOrder.Add("GetByEmailHash"));

        _passwordHashingService.VerifyPassword(_testPassword, _testPasswordHash)
            .Returns(true)
            .AndDoes(x => callOrder.Add("VerifyPassword"));

        _jwtTokenService.GenerateAccessTokenAsync(user.Id, user.EmailHash, Arg.Any<CancellationToken>())
            .Returns(_testAccessToken)
            .AndDoes(x => callOrder.Add("GenerateAccessToken"));

        _jwtTokenService.GenerateRefreshTokenAsync(user.Id, Arg.Any<CancellationToken>())
            .Returns(_testRefreshToken)
            .AndDoes(x => callOrder.Add("GenerateRefreshToken"));

        _jwtTokenService.GetTokenExpiryTime(false)
            .Returns(_testExpiresAt)
            .AndDoes(x => callOrder.Add("GetTokenExpiryTime"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        callOrder.Should().Equal("HashEmail", "GetByEmailHash", "VerifyPassword",
            "GenerateAccessToken", "GenerateRefreshToken", "GetTokenExpiryTime");
    }

    [Fact]
    public async Task response_contains_all_required_fieldsAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword };
        var user = CreateTestUser();

        SetupMocksForSuccessfulLogin(user);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var response = result.Value!;

        response.AccessToken.Should().Be(_testAccessToken);
        response.RefreshToken.Should().Be(_testRefreshToken);
        response.ExpiresAt.Should().Be(_testExpiresAt);

        response.User.Id.Should().Be(user.Id);
        response.User.EmailHash.Should().Be(user.EmailHash);
        response.User.EmailVerified.Should().Be(user.EmailVerified);
        response.User.CreatedAt.Should().Be(user.CreatedAt);
    }

    [Fact]
    public async Task email_is_hashed_before_user_lookupAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword };

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns((User?)null);

        // Act
        _ = await _handler.Handle(request, CancellationToken.None);

        // Assert
        _emailHashingService.Received(1).HashEmail(_testEmail);
        _userRepository.Received(1).GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task password_verification_uses_stored_hashAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword };
        var user = CreateTestUser();

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(user);
        _passwordHashingService.VerifyPassword(_testPassword, _testPasswordHash)
            .Returns(true);

        // Act
        _ = await _handler.Handle(request, CancellationToken.None);

        // Assert
        _passwordHashingService.Received(1).VerifyPassword(_testPassword, _testPasswordHash);
    }

    private User CreateTestUser()
    {
        var userResult = User.Create(_testEmailHash, _testPasswordHash);
        var user = userResult.Value!;
        user.VerifyEmail(); // Verify email for existing tests that expect login to work
        return user;
    }

    private User CreateUnverifiedTestUser()
    {
        var userResult = User.Create(_testEmailHash, _testPasswordHash);
        return userResult.Value!; // Returns unverified user
    }

    private void SetupMocksForSuccessfulLogin(User user)
    {
        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(user);
        _passwordHashingService.VerifyPassword(_testPassword, _testPasswordHash)
            .Returns(true);
        _jwtTokenService.GenerateAccessTokenAsync(user.Id, user.EmailHash, Arg.Any<CancellationToken>())
            .Returns(_testAccessToken);
        _jwtTokenService.GenerateRefreshTokenAsync(user.Id, Arg.Any<CancellationToken>())
            .Returns(_testRefreshToken);
        _jwtTokenService.GetTokenExpiryTime(false)
            .Returns(_testExpiresAt);
    }

    // NEW TESTS FOR EMAIL VERIFICATION REQUIREMENT IN LOGIN (Issue #94)

    [Fact]
    public async Task unverified_user_cannot_loginAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword };
        var user = CreateUnverifiedTestUser();

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(user);
        _passwordHashingService.VerifyPassword(_testPassword, _testPasswordHash)
            .Returns(true);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("email verification");
    }

    [Fact]
    public async Task verified_user_can_login_normallyAsync()
    {
        // Arrange
        var request = new CLoginUser { Email = _testEmail, Password = _testPassword };
        var user = CreateTestUser();
        user.VerifyEmail(); // Verify the user's email

        SetupMocksForSuccessfulLogin(user);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.AccessToken.Should().Be(_testAccessToken);
        result.Value.RefreshToken.Should().Be(_testRefreshToken);
        result.Value.User.EmailVerified.Should().BeTrue();
    }
}
