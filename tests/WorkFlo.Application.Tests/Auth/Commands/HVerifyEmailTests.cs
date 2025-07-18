using WorkFlo.Application.Auth.Commands;
using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Users;
using FluentAssertions;
using NSubstitute;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Application.Tests.Auth.Commands;

/// <summary>
/// Tests for email verification command handler
/// Following TDD Red-Green-Refactor-Cover-Commit cycle
/// GitHub Issue #78: Email Verification System - Critical Authentication Enhancement
/// </summary>
public class HVerifyEmailTests
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailVerificationTokenService _tokenService;
    private readonly HVerifyEmail _handler;

    private readonly string _testToken = "verification_token_123";
    private readonly string _testEmailHash = "hashed_email_123";
    private readonly Guid _testUserId = Guid.NewGuid();

    public HVerifyEmailTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _tokenService = Substitute.For<IEmailVerificationTokenService>();

        _handler = new HVerifyEmail(_userRepository, _tokenService);
    }

    [Fact]
    public async Task user_receives_verification_email_after_registrationAsync()
    {
        // Arrange
        var request = new CVerifyEmail { Token = _testToken };

        var user = CreateUnverifiedUser();

        _tokenService.ValidateTokenAsync(_testToken, Arg.Any<CancellationToken>())
            .Returns(Success(user.Id));

        _userRepository.GetByIdAsync(user.Id, Arg.Any<CancellationToken>())
            .Returns(user);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be("Email verified successfully");

        // Verify user was marked as verified
        await _userRepository.Received(1).UpdateAsync(
            Arg.Is<User>(u => u.EmailVerified));
    }

    [Fact]
    public async Task verification_token_validates_correctlyAsync()
    {
        // Arrange
        var request = new CVerifyEmail { Token = _testToken };

        var user = CreateUnverifiedUser();

        _tokenService.ValidateTokenAsync(_testToken, Arg.Any<CancellationToken>())
            .Returns(Success(user.Id));

        _userRepository.GetByIdAsync(user.Id, Arg.Any<CancellationToken>())
            .Returns(user);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        _tokenService.Received(1).ValidateTokenAsync(_testToken, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task expired_verification_token_is_rejectedAsync()
    {
        // Arrange
        var request = new CVerifyEmail { Token = _testToken };

        _tokenService.ValidateTokenAsync(_testToken, Arg.Any<CancellationToken>())
            .Returns(Failure<Guid>("Token has expired"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Token has expired");
    }

    [Fact]
    public async Task invalid_verification_token_is_rejectedAsync()
    {
        // Arrange
        var request = new CVerifyEmail { Token = "invalid_token" };

        _tokenService.ValidateTokenAsync("invalid_token", Arg.Any<CancellationToken>())
            .Returns(Failure<Guid>("Invalid token"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid token");
    }

    [Fact]
    public async Task user_not_found_returns_errorAsync()
    {
        // Arrange
        var request = new CVerifyEmail { Token = _testToken };

        _tokenService.ValidateTokenAsync(_testToken, Arg.Any<CancellationToken>())
            .Returns(Success(_testUserId));

        _userRepository.GetByIdAsync(_testUserId, Arg.Any<CancellationToken>())
            .Returns((User?)null);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("User not found");
    }

    [Fact]
    public async Task empty_token_returns_errorAsync()
    {
        // Arrange
        var request = new CVerifyEmail { Token = "" };

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Token is required");
    }

    [Fact]
    public async Task already_verified_user_returns_successAsync()
    {
        // Arrange
        var request = new CVerifyEmail { Token = _testToken };

        var user = CreateVerifiedUser();

        _tokenService.ValidateTokenAsync(_testToken, Arg.Any<CancellationToken>())
            .Returns(Success(user.Id));

        _userRepository.GetByIdAsync(user.Id, Arg.Any<CancellationToken>())
            .Returns(user);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be("Email verified successfully");

        // Verify user was NOT updated (idempotent)
        await _userRepository.DidNotReceive().UpdateAsync(Arg.Any<User>());
    }

    private User CreateUnverifiedUser()
    {
        var userResult = User.Create(_testEmailHash, "password_hash_123");
        var user = userResult.Value!;
        // User starts unverified
        user.EmailVerified.Should().BeFalse();
        return user;
    }

    private User CreateVerifiedUser()
    {
        var userResult = User.Create(_testEmailHash, "password_hash_123");
        var user = userResult.Value!;
        // Mark user as verified
        user.VerifyEmail();
        user.EmailVerified.Should().BeTrue();
        return user;
    }
}
