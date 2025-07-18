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
/// Security-focused tests for token refresh command handler
/// Following TDD Red-Green-Refactor-Cover-Commit cycle
/// GitHub Issue #57: Authentication Command Handler Tests
/// </summary>
public class HRefreshTokenTests
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly HRefreshToken _handler;

    private readonly string _testRefreshToken = "valid_refresh_token_123";
    private readonly string _testEmailHash = "hashed_email_123";
    private readonly string _testPasswordHash = "hashed_password_123";
    private readonly Guid _testUserId = Guid.NewGuid();
    private readonly string _testNewAccessToken = "new_access_token_123";
    private readonly string _testNewRefreshToken = "new_refresh_token_123";
    private readonly DateTime _testExpiresAt = DateTime.UtcNow.AddDays(7);

    public HRefreshTokenTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _jwtTokenService = Substitute.For<IJwtTokenService>();

        _handler = new HRefreshToken(
            _userRepository,
            _jwtTokenService
        );
    }

    [Fact]
    public async Task valid_refresh_token_generates_new_tokens_successfullyAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };
        var user = CreateTestUser();

        SetupMocksForSuccessfulRefresh(user);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.AccessToken.Should().Be(_testNewAccessToken);
        result.Value.RefreshToken.Should().Be(_testNewRefreshToken);
        result.Value.ExpiresAt.Should().Be(_testExpiresAt);
    }

    [Fact]
    public async Task invalid_refresh_token_fails_user_id_extractionAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = "invalid_token" };

        _jwtTokenService.GetUserIdFromTokenAsync("invalid_token", Arg.Any<CancellationToken>())
            .Returns((Guid?)null);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid refresh token");
    }

    [Fact]
    public async Task expired_refresh_token_fails_validationAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };

        _jwtTokenService.GetUserIdFromTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(_testUserId);
        _jwtTokenService.ValidateRefreshTokenAsync(_testRefreshToken, _testUserId, Arg.Any<CancellationToken>())
            .Returns(false);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid or expired refresh token");
    }

    [Fact]
    public async Task nonexistent_user_fails_refreshAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };

        _jwtTokenService.GetUserIdFromTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(_testUserId);
        _jwtTokenService.ValidateRefreshTokenAsync(_testRefreshToken, _testUserId, Arg.Any<CancellationToken>())
            .Returns(true);
        _userRepository.GetByIdAsync(_testUserId, Arg.Any<CancellationToken>())
            .Returns((User?)null);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("User not found or inactive");
    }

    [Fact]
    public async Task inactive_user_fails_refreshAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };
        var user = CreateTestUser();
        user.Deactivate(); // Make user inactive

        _jwtTokenService.GetUserIdFromTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(_testUserId);
        _jwtTokenService.ValidateRefreshTokenAsync(_testRefreshToken, _testUserId, Arg.Any<CancellationToken>())
            .Returns(true);
        _userRepository.GetByIdAsync(_testUserId, Arg.Any<CancellationToken>())
            .Returns(user);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("User not found or inactive");
    }

    [Fact]
    public Task null_request_throws_exceptionAsync()
    {
        // Act & Assert
        return FluentActions.Invoking(() => _handler.Handle(null!, CancellationToken.None))
            .Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task jwt_service_get_user_id_exception_returns_failureAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };

        _jwtTokenService.GetUserIdFromTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Throws(new InvalidOperationException("Token parsing failed"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to refresh token");
        result.Error.Should().Contain("Token parsing failed");
    }

    [Fact]
    public async Task jwt_service_validate_token_exception_returns_failureAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };

        _jwtTokenService.GetUserIdFromTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(_testUserId);
        _jwtTokenService.ValidateRefreshTokenAsync(_testRefreshToken, _testUserId, Arg.Any<CancellationToken>())
            .Throws(new InvalidOperationException("Token validation failed"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to refresh token");
        result.Error.Should().Contain("Token validation failed");
    }

    [Fact]
    public async Task user_repository_exception_returns_failureAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };

        _jwtTokenService.GetUserIdFromTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(_testUserId);
        _jwtTokenService.ValidateRefreshTokenAsync(_testRefreshToken, _testUserId, Arg.Any<CancellationToken>())
            .Returns(true);
        _userRepository.GetByIdAsync(_testUserId, Arg.Any<CancellationToken>())
            .Throws(new InvalidOperationException("Database connection failed"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to refresh token");
        result.Error.Should().Contain("Database connection failed");
    }

    [Fact]
    public async Task new_access_token_generation_exception_returns_failureAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };
        var user = CreateTestUser();

        _jwtTokenService.GetUserIdFromTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(_testUserId);
        _jwtTokenService.ValidateRefreshTokenAsync(_testRefreshToken, _testUserId, Arg.Any<CancellationToken>())
            .Returns(true);
        _userRepository.GetByIdAsync(_testUserId, Arg.Any<CancellationToken>())
            .Returns(user);
        _jwtTokenService.GenerateAccessTokenAsync(user.Id, user.EmailHash, Arg.Any<CancellationToken>())
            .Throws(new InvalidOperationException("Access token generation failed"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to refresh token");
        result.Error.Should().Contain("Access token generation failed");
    }

    [Fact]
    public async Task new_refresh_token_generation_exception_returns_failureAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };
        var user = CreateTestUser();

        _jwtTokenService.GetUserIdFromTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(_testUserId);
        _jwtTokenService.ValidateRefreshTokenAsync(_testRefreshToken, _testUserId, Arg.Any<CancellationToken>())
            .Returns(true);
        _userRepository.GetByIdAsync(_testUserId, Arg.Any<CancellationToken>())
            .Returns(user);
        _jwtTokenService.GenerateAccessTokenAsync(user.Id, user.EmailHash, Arg.Any<CancellationToken>())
            .Returns(_testNewAccessToken);
        _jwtTokenService.GenerateRefreshTokenAsync(user.Id, Arg.Any<CancellationToken>())
            .Throws(new InvalidOperationException("Refresh token generation failed"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to refresh token");
        result.Error.Should().Contain("Refresh token generation failed");
    }

    [Fact]
    public async Task old_refresh_token_revocation_exception_returns_failureAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };
        var user = CreateTestUser();

        _jwtTokenService.GetUserIdFromTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(_testUserId);
        _jwtTokenService.ValidateRefreshTokenAsync(_testRefreshToken, _testUserId, Arg.Any<CancellationToken>())
            .Returns(true);
        _userRepository.GetByIdAsync(_testUserId, Arg.Any<CancellationToken>())
            .Returns(user);
        _jwtTokenService.GenerateAccessTokenAsync(user.Id, user.EmailHash, Arg.Any<CancellationToken>())
            .Returns(_testNewAccessToken);
        _jwtTokenService.GenerateRefreshTokenAsync(user.Id, Arg.Any<CancellationToken>())
            .Returns(_testNewRefreshToken);
        _jwtTokenService.GetTokenExpiryTime()
            .Returns(_testExpiresAt);
        _jwtTokenService.RevokeRefreshTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Throws(new InvalidOperationException("Token revocation failed"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to refresh token");
        result.Error.Should().Contain("Token revocation failed");
    }

    [Fact]
    public Task cancellation_token_is_respectedAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };
        var cancellationToken = new CancellationToken(canceled: true);

        // Act & Assert
        return FluentActions.Invoking(() => _handler.Handle(request, cancellationToken))
            .Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task refresh_calls_services_in_correct_orderAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };
        var user = CreateTestUser();
        var callOrder = new List<string>();

        _jwtTokenService.GetUserIdFromTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(_testUserId)
            .AndDoes(x => callOrder.Add("GetUserIdFromToken"));

        _jwtTokenService.ValidateRefreshTokenAsync(_testRefreshToken, _testUserId, Arg.Any<CancellationToken>())
            .Returns(true)
            .AndDoes(x => callOrder.Add("ValidateRefreshToken"));

        _userRepository.GetByIdAsync(_testUserId, Arg.Any<CancellationToken>())
            .Returns(user)
            .AndDoes(x => callOrder.Add("GetUserById"));

        _jwtTokenService.GenerateAccessTokenAsync(user.Id, user.EmailHash, Arg.Any<CancellationToken>())
            .Returns(_testNewAccessToken)
            .AndDoes(x => callOrder.Add("GenerateAccessToken"));

        _jwtTokenService.GenerateRefreshTokenAsync(user.Id, Arg.Any<CancellationToken>())
            .Returns(_testNewRefreshToken)
            .AndDoes(x => callOrder.Add("GenerateRefreshToken"));

        _jwtTokenService.GetTokenExpiryTime()
            .Returns(_testExpiresAt)
            .AndDoes(x => callOrder.Add("GetTokenExpiryTime"));

        _jwtTokenService.RevokeRefreshTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask)
            .AndDoes(x => callOrder.Add("RevokeRefreshToken"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        callOrder.Should().Equal("GetUserIdFromToken", "ValidateRefreshToken", "GetUserById",
            "GenerateAccessToken", "GenerateRefreshToken", "GetTokenExpiryTime", "RevokeRefreshToken");
    }

    [Fact]
    public async Task old_refresh_token_is_revoked_after_successAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };
        var user = CreateTestUser();

        SetupMocksForSuccessfulRefresh(user);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        await _jwtTokenService.Received(1).RevokeRefreshTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task response_contains_all_required_fieldsAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };
        var user = CreateTestUser();

        SetupMocksForSuccessfulRefresh(user);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var response = result.Value!;

        response.AccessToken.Should().Be(_testNewAccessToken);
        response.RefreshToken.Should().Be(_testNewRefreshToken);
        response.ExpiresAt.Should().Be(_testExpiresAt);
    }

    [Fact]
    public async Task user_validation_checks_both_existence_and_active_statusAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };

        _jwtTokenService.GetUserIdFromTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(_testUserId);
        _jwtTokenService.ValidateRefreshTokenAsync(_testRefreshToken, _testUserId, Arg.Any<CancellationToken>())
            .Returns(true);

        // Test case 1: User doesn't exist
        _userRepository.GetByIdAsync(_testUserId, Arg.Any<CancellationToken>())
            .Returns((User?)null);

        var result1 = await _handler.Handle(request, CancellationToken.None);
        result1.IsSuccess.Should().BeFalse();
        result1.Error.Should().Be("User not found or inactive");

        // Test case 2: User exists but inactive
        var inactiveUser = CreateTestUser();
        inactiveUser.Deactivate();
        _userRepository.GetByIdAsync(_testUserId, Arg.Any<CancellationToken>())
            .Returns(inactiveUser);

        var result2 = await _handler.Handle(request, CancellationToken.None);
        result2.IsSuccess.Should().BeFalse();
        result2.Error.Should().Be("User not found or inactive");
    }

    [Fact]
    public async Task security_token_validation_happens_before_user_lookupAsync()
    {
        // Arrange
        var request = new CRefreshToken { RefreshToken = _testRefreshToken };

        _jwtTokenService.GetUserIdFromTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(_testUserId);
        _jwtTokenService.ValidateRefreshTokenAsync(_testRefreshToken, _testUserId, Arg.Any<CancellationToken>())
            .Returns(false); // Invalid token

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid or expired refresh token");

        // Verify user lookup never happened since token validation failed
        await _userRepository.DidNotReceive().GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    private User CreateTestUser()
    {
        var userResult = User.Create(_testEmailHash, _testPasswordHash);
        return userResult.Value!;
    }

    private void SetupMocksForSuccessfulRefresh(User user)
    {
        _jwtTokenService.GetUserIdFromTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(_testUserId);
        _jwtTokenService.ValidateRefreshTokenAsync(_testRefreshToken, _testUserId, Arg.Any<CancellationToken>())
            .Returns(true);
        _userRepository.GetByIdAsync(_testUserId, Arg.Any<CancellationToken>())
            .Returns(user);
        _jwtTokenService.GenerateAccessTokenAsync(user.Id, user.EmailHash, Arg.Any<CancellationToken>())
            .Returns(_testNewAccessToken);
        _jwtTokenService.GenerateRefreshTokenAsync(user.Id, Arg.Any<CancellationToken>())
            .Returns(_testNewRefreshToken);
        _jwtTokenService.GetTokenExpiryTime()
            .Returns(_testExpiresAt);
        _jwtTokenService.RevokeRefreshTokenAsync(_testRefreshToken, Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
    }
}
