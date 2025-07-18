using WorkFlo.Application.Auth.Commands;
using WorkFlo.Application.Auth.Services;
using WorkFlo.Application.Common.Interfaces;
using WorkFlo.Application.Services;
using WorkFlo.Domain.Common;
using WorkFlo.Domain.Users;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace WorkFlo.Application.Tests.Auth.Commands;

/// <summary>
/// Tests for HRegisterUser command handler using TDD approach.
/// 
/// These tests verify the complete user registration flow including:
/// - User creation with email hashing for privacy
/// - Password breach checking
/// - Email verification token generation and sending
/// - All validation and error handling scenarios
/// 
/// Following TDD Red-Green-Refactor-Cover-Commit cycle
/// GitHub Issue #57: Authentication Command Handler Tests
/// </summary>
public class HRegisterUserTests
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHashingService _passwordHashingService;
    private readonly IEmailHashingService _emailHashingService;
    private readonly IPasswordBreachService _passwordBreachService;
    private readonly IEmailService _emailService;
    private readonly IEmailVerificationTokenService _emailVerificationTokenService;
    private readonly HRegisterUser _handler;

    private readonly string _testEmail = "new@example.com";
    private readonly string _testPassword = "NewPassword123!";
    private readonly string _testEmailHash = "hashed_email_new_123";
    private readonly string _testPasswordHash = "hashed_password_new_123";
    private readonly string _testVerificationToken = "verification_token_123";

    public HRegisterUserTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _passwordHashingService = Substitute.For<IPasswordHashingService>();
        _emailHashingService = Substitute.For<IEmailHashingService>();
        _passwordBreachService = Substitute.For<IPasswordBreachService>();
        _emailService = Substitute.For<IEmailService>();
        _emailVerificationTokenService = Substitute.For<IEmailVerificationTokenService>();

        _handler = new HRegisterUser(
            _userRepository,
            _passwordHashingService,
            _emailHashingService,
            _passwordBreachService,
            _emailService,
            _emailVerificationTokenService
        );
    }

    [Fact]
    public async Task new_user_can_register_successfullyAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        SetupMocksForSuccessfulRegistrationWithoutJwt();

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.AccessToken.Should().BeNull(); // No JWT tokens returned
        result.Value.RefreshToken.Should().BeNull();
        result.Value.ExpiresAt.Should().BeNull();
        result.Value.EmailVerificationRequired.Should().BeTrue();
        result.Value.Message.Should().Be("Registration successful. Please check your email for verification instructions.");
        result.Value.UserId.Should().NotBeEmpty();
        result.Value.User.EmailHash.Should().Be(_testEmailHash);
        result.Value.User.EmailVerified.Should().BeFalse(); // New users start unverified
    }

    [Fact]
    public async Task existing_user_email_fails_registrationAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        var existingUserResult = User.Create(_testEmailHash, "existing_password_hash");
        var existingUser = existingUserResult.Value!;
        existingUser.VerifyEmail(); // Make user verified

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(existingUser);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("A user with this email address already exists");
    }

    [Fact]
    public async Task password_breach_check_fails_registrationAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns((User?)null);
        _passwordBreachService.IsPasswordBreachedAsync(_testPassword, Arg.Any<CancellationToken>())
            .Returns(true); // Password is breached

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("This password has been found in a data breach");
    }

    [Fact]
    public async Task password_breach_check_exception_fails_registrationAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns((User?)null);
        _passwordBreachService.IsPasswordBreachedAsync(_testPassword, Arg.Any<CancellationToken>())
            .Returns(Task.FromException<bool>(new InvalidOperationException("Breach service unavailable")));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to register user");
        result.Error.Should().Contain("Breach service unavailable");
    }

    [Fact]
    public async Task email_hashing_service_exception_fails_registrationAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        _emailHashingService.HashEmail(_testEmail)
            .Returns(x => throw new InvalidOperationException("Email hashing failed"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to register user");
        result.Error.Should().Contain("Email hashing failed");
    }

    [Fact]
    public async Task user_repository_exception_fails_registrationAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns((User?)null);
        _passwordBreachService.IsPasswordBreachedAsync(_testPassword, Arg.Any<CancellationToken>())
            .Returns(false); // Password is not breached
        _passwordHashingService.HashPassword(_testPassword).Returns(_testPasswordHash);
        _userRepository.AddAsync(Arg.Any<User>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromException(new InvalidOperationException("Database write failed")));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to register user");
        result.Error.Should().Contain("Database write failed");
    }


    [Fact]
    public Task cancellation_token_is_respectedAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        var cancellationToken = new CancellationToken(true);

        // Act & Assert
        var act = async () => await _handler.Handle(request, cancellationToken);
        return act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task proper_execution_order_maintainedAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        var callOrder = new List<string>();

        _emailHashingService.HashEmail(_testEmail)
            .Returns(_testEmailHash)
            .AndDoes(x => callOrder.Add("HashEmail"));

        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns((User?)null)
            .AndDoes(x => callOrder.Add("CheckExistingUser"));

        _passwordBreachService.IsPasswordBreachedAsync(_testPassword, Arg.Any<CancellationToken>())
            .Returns(false)
            .AndDoes(x => callOrder.Add("CheckPasswordBreach"));

        _passwordHashingService.HashPassword(_testPassword)
            .Returns(_testPasswordHash)
            .AndDoes(x => callOrder.Add("HashPassword"));

        _userRepository.AddAsync(Arg.Any<User>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask)
            .AndDoes(x => callOrder.Add("AddUser"));

        _emailVerificationTokenService.GenerateTokenAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(_testVerificationToken)
            .AndDoes(x => callOrder.Add("GenerateEmailToken"));

        _emailService.SendVerificationEmailAsync(_testEmail, _testVerificationToken, Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Result.Success())
            .AndDoes(x => callOrder.Add("SendVerificationEmail"));

        // No JWT token generation for unverified users

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        callOrder.Should().Equal("HashEmail", "CheckExistingUser", "CheckPasswordBreach", "HashPassword",
            "AddUser", "GenerateEmailToken", "SendVerificationEmail");
    }

    [Fact]
    public async Task response_contains_all_required_fieldsAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        SetupMocksForSuccessfulRegistrationWithoutJwt();

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var response = result.Value!;

        response.AccessToken.Should().BeNull(); // No JWT tokens for unverified users
        response.RefreshToken.Should().BeNull();
        response.ExpiresAt.Should().BeNull();
        response.EmailVerificationRequired.Should().BeTrue();
        response.Message.Should().Be("Registration successful. Please check your email for verification instructions.");
        response.UserId.Should().NotBeEmpty();

        response.User.Id.Should().NotBeEmpty();
        response.User.EmailHash.Should().Be(_testEmailHash);
        response.User.EmailVerified.Should().BeFalse();
        response.User.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task null_request_throws_argument_null_exceptionAsync()
    {
        // Arrange
        CRegisterUser? request = null;

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _handler.Handle(request!, CancellationToken.None));
    }

    [Fact]
    public async Task password_hashing_service_exception_fails_registrationAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns((User?)null);
        _passwordBreachService.IsPasswordBreachedAsync(_testPassword, Arg.Any<CancellationToken>())
            .Returns(false); // Password is not breached
        _passwordHashingService.HashPassword(_testPassword)
            .Returns(x => throw new InvalidOperationException("Password hashing failed"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to register user");
        result.Error.Should().Contain("Password hashing failed");
    }

    [Fact]
    public async Task user_repository_lookup_exception_fails_registrationAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns(Task.FromException<User?>(new InvalidOperationException("Database lookup failed")));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to register user");
        result.Error.Should().Contain("Database lookup failed");
    }

    [Fact]
    public async Task user_created_with_correct_properties_and_not_verifiedAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        User? capturedUser = null;

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns((User?)null);
        _passwordBreachService.IsPasswordBreachedAsync(_testPassword, Arg.Any<CancellationToken>())
            .Returns(false); // Password is not breached
        _passwordHashingService.HashPassword(_testPassword).Returns(_testPasswordHash);
        _userRepository.AddAsync(Arg.Do<User>(u => capturedUser = u), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(request, CancellationToken.None);

        // Assert - Verify user properties
        capturedUser.Should().NotBeNull();
        capturedUser!.EmailHash.Should().Be(_testEmailHash);
        capturedUser.PasswordHash.Should().Be(_testPasswordHash);
        capturedUser.IsActive.Should().BeTrue();
        capturedUser.EmailVerified.Should().BeFalse();
    }

    [Fact]
    public async Task privacy_compliance_email_never_stored_in_plain_textAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };
        User? capturedUser = null;

        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns((User?)null);
        _passwordHashingService.HashPassword(_testPassword).Returns(_testPasswordHash);
        _userRepository.AddAsync(Arg.Do<User>(u => capturedUser = u), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(request, CancellationToken.None);

        // Assert - Verify email is never stored in plain text
        capturedUser.Should().NotBeNull();
        capturedUser!.EmailHash.Should().Be(_testEmailHash);
        capturedUser.EmailHash.Should().NotBe(_testEmail); // Email is hashed, not stored in plain text
    }

    // Helper methods
    private void SetupMocksForSuccessfulRegistrationWithoutJwt()
    {
        _emailHashingService.HashEmail(_testEmail).Returns(_testEmailHash);
        _userRepository.GetByEmailHashAsync(_testEmailHash, Arg.Any<CancellationToken>())
            .Returns((User?)null);
        _passwordBreachService.IsPasswordBreachedAsync(_testPassword, Arg.Any<CancellationToken>())
            .Returns(false); // Password is not breached
        _passwordHashingService.HashPassword(_testPassword).Returns(_testPasswordHash);
        _userRepository.AddAsync(Arg.Any<User>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _emailVerificationTokenService.GenerateTokenAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(_testVerificationToken);
        _emailService.SendVerificationEmailAsync(_testEmail, _testVerificationToken, Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Result.Success());
    }


    // NEW TESTS FOR EMAIL VERIFICATION INTEGRATION (Issue #94)

    [Fact]
    public async Task registration_sends_verification_emailAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        SetupMocksForSuccessfulRegistrationWithoutJwt();

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        await _emailVerificationTokenService.Received(1).GenerateTokenAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
        await _emailService.Received(1).SendVerificationEmailAsync(_testEmail, _testVerificationToken, Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task registration_does_not_return_jwt_tokens_when_email_verification_requiredAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        SetupMocksForSuccessfulRegistrationWithoutJwt();

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var response = result.Value!;

        // Should NOT contain JWT tokens
        response.AccessToken.Should().BeNull();
        response.RefreshToken.Should().BeNull();
        response.ExpiresAt.Should().BeNull();

        // Should indicate email verification is required
        response.EmailVerificationRequired.Should().BeTrue();
        response.Message.Should().Be("Registration successful. Please check your email for verification instructions.");

        // Should still contain user info
        response.UserId.Should().NotBeEmpty();
        response.User.Should().NotBeNull();
        response.User.EmailVerified.Should().BeFalse();
    }

    [Fact]
    public async Task registration_fails_when_email_token_generation_failsAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        SetupMocksForSuccessfulRegistrationWithoutJwt();
        _emailVerificationTokenService.GenerateTokenAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromException<string>(new InvalidOperationException("Token generation failed")));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to register user");
        result.Error.Should().Contain("Token generation failed");
    }

    [Fact]
    public async Task registration_fails_when_email_sending_failsAsync()
    {
        // Arrange
        var request = new CRegisterUser
        {
            Email = _testEmail,
            Password = _testPassword,
            ConfirmPassword = _testPassword
        };

        SetupMocksForSuccessfulRegistrationWithoutJwt();
        _emailVerificationTokenService.GenerateTokenAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(_testVerificationToken);
        _emailService.SendVerificationEmailAsync(_testEmail, _testVerificationToken, Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Result.Failure("Email sending failed"));

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Failed to register user");
        result.Error.Should().Contain("Email sending failed");
    }

}
