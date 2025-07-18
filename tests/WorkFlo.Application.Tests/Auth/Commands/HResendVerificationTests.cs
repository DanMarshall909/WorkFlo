using WorkFlo.Application.Auth.Commands;
using WorkFlo.Application.Auth.Services;
using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Application.Services;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Users;
using FluentAssertions;
using NSubstitute;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Application.Tests.Auth.Commands;

/// <summary>
/// Tests for resend verification command handler
/// Following TDD Red-Green-Refactor-Cover-Commit cycle
/// GitHub Issue #78: Email Verification System - Critical Authentication Enhancement
/// </summary>
public class HResendVerificationTests
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailHashingService _emailHashingService;
    private readonly IEmailVerificationTokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly HResendVerification _handler;

    private readonly string _testEmail = "test@example.com";
    private readonly string _testEmailHash = "hashed_email_123";
    private readonly string _testToken = "verification_token_123";

    public HResendVerificationTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _emailHashingService = Substitute.For<IEmailHashingService>();
        _tokenService = Substitute.For<IEmailVerificationTokenService>();
        _emailService = Substitute.For<IEmailService>();

        _handler = new HResendVerification(
            _userRepository,
            _emailHashingService,
            _tokenService,
            _emailService);
    }

    [Fact]
    public async Task unverified_user_can_request_resend_verificationAsync()
    {
        // Arrange
        var request = new CResendVerification { Email = _testEmail };
        var user = CreateUnverifiedUser();

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(user);
        _tokenService.GenerateTokenAsync(user.Id, Arg.Any<CancellationToken>())
            .Returns(_testToken);
        _emailService.SendVerificationEmailAsync(_testEmail, _testToken, "", Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be("Verification email sent successfully");

        // Verify email was sent
        await _emailService.Received(1).SendVerificationEmailAsync(
            _testEmail, _testToken, "", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task user_not_found_returns_errorAsync()
    {
        // Arrange
        var request = new CResendVerification { Email = _testEmail };

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns((User?)null);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("User not found");
    }

    [Fact]
    public async Task already_verified_user_returns_errorAsync()
    {
        // Arrange
        var request = new CResendVerification { Email = _testEmail };
        var user = CreateVerifiedUser();

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(user);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Email is already verified");

        // Verify no email was sent
        await _emailService.DidNotReceive().SendVerificationEmailAsync(
            Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task empty_email_returns_errorAsync()
    {
        // Arrange
        var request = new CResendVerification { Email = "" };

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Email is required");
    }

    [Fact]
    public async Task email_service_failure_returns_errorAsync()
    {
        // Arrange
        var request = new CResendVerification { Email = _testEmail };
        var user = CreateUnverifiedUser();

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(user);
        _tokenService.GenerateTokenAsync(user.Id, Arg.Any<CancellationToken>())
            .Returns(_testToken);
        _emailService.SendVerificationEmailAsync(_testEmail, _testToken, "", Arg.Any<CancellationToken>())
            .Returns(Result.Failure("Email service unavailable"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Failed to send verification email");
    }

    private User CreateUnverifiedUser()
    {
        var userResult = User.Create(_testEmailHash, "password_hash_123");
        var user = userResult.Value!;
        user.EmailVerified.Should().BeFalse();
        return user;
    }

    private User CreateVerifiedUser()
    {
        var userResult = User.Create(_testEmailHash, "password_hash_123");
        var user = userResult.Value!;
        user.VerifyEmail();
        user.EmailVerified.Should().BeTrue();
        return user;
    }
}
