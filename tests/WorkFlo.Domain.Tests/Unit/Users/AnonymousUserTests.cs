using WorkFlo.Domain.Common.Errors;
using WorkFlo.Domain.Users;
using FluentAssertions;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Domain.Tests.Unit.Users;

/// <summary>
/// Unit tests for user functionality including anonymous and registered users
/// Tests privacy-first user creation, management, and conversion
/// GitHub Issue #18: Privacy-First Authentication System - Anonymous Users
/// </summary>
public class UserTests
{
    [Fact]
    public void CreateAnonymous_should_generate_temporary_user()
    {
        // Act
        var user = User.CreateAnonymous();

        // Assert
        user.Should().NotBeNull();
        user.Id.Should().NotBe(Guid.Empty);
        user.IsAnonymous.Should().BeTrue();
        user.EmailHash.Should().BeNullOrEmpty();
        user.EmailVerified.Should().BeFalse();
        user.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void CreateAnonymous_should_generate_unique_users()
    {
        // Act
        var user1 = User.CreateAnonymous();
        var user2 = User.CreateAnonymous();

        // Assert
        user1.Id.Should().NotBe(user2.Id);
        user1.Should().NotBeSameAs(user2);
    }

    [Fact]
    public void anonymous_user_should_have_data_expiration()
    {
        // Act
        var user = User.CreateAnonymous();

        // Assert
        user.DataExpiresAt.Should().NotBeNull();
        user.DataExpiresAt.Should().BeAfter(DateTime.UtcNow.AddDays(6)); // At least 7 days
        user.DataExpiresAt.Should().BeBefore(DateTime.UtcNow.AddDays(31)); // No more than 30 days
    }

    [Fact]
    public void anonymous_user_should_have_limited_privacy_capabilities()
    {
        // Arrange
        var user = User.CreateAnonymous();

        // Assert
        user.CanAccessCloudFeatures.Should().BeFalse("Anonymous users should be local-only");
        user.CanExportData.Should().BeTrue("Anonymous users should be able to export their data");
        user.HasDataRetentionLimits.Should().BeTrue("Anonymous users should have data retention limits");
    }

    [Fact]
    public void ConvertToRegistered_should_upgrade_anonymous_user()
    {
        // Arrange
        var anonymousUser = User.CreateAnonymous();
        var emailHash = "hashed_email@example.com";
        var preferredName = "John Doe";

        // Act
        var result = anonymousUser.ConvertToRegistered(emailHash, preferredName);

        // Assert
        result.IsSuccess.Should().BeTrue();
        anonymousUser.IsAnonymous.Should().BeFalse();
        anonymousUser.EmailHash.Should().Be(emailHash);
        anonymousUser.PreferredName.Should().Be(preferredName);
        anonymousUser.EmailVerified.Should().BeFalse(); // Needs verification
        anonymousUser.DataExpiresAt.Should().BeNull(); // No expiration for registered users
    }

    [Fact]
    public void ConvertToRegistered_when_already_registered_returns_failure()
    {
        // Arrange
        var result = User.Create("test@example.com", "password123");
        var user = result.Value!;

        // Act
        var convertResult = user.ConvertToRegistered("new@example.com", "Test User");

        // Assert
        convertResult.IsSuccess.Should().BeFalse();
        convertResult.Error.Should().BeOfType<BusinessRuleError.InvalidUserState>();
        convertResult.Error.Message.Should().Be("User must be 'anonymous' but is currently 'registered'");
    }

    [Fact]
    public void ConvertToRegistered_when_email_hash_empty_returns_failure()
    {
        // Arrange
        var anonymousUser = User.CreateAnonymous();

        // Act
        var result = anonymousUser.ConvertToRegistered("", "Test User");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().BeOfType<ValidationError.Required>();
        result.Error.Message.Should().Be("Email hash is required");
    }

    [Fact]
    public void ConvertToRegistered_when_email_hash_null_returns_failure()
    {
        // Arrange
        var anonymousUser = User.CreateAnonymous();

        // Act
        var result = anonymousUser.ConvertToRegistered(null!, "Test User");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().BeOfType<ValidationError.Required>();
        result.Error.Message.Should().Be("Email hash is required");
    }

    [Fact]
    public void ConvertToRegistered_when_preferred_name_empty_returns_failure()
    {
        // Arrange
        var anonymousUser = User.CreateAnonymous();

        // Act
        var result = anonymousUser.ConvertToRegistered("test@example.com", "");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().BeOfType<ValidationError.Required>();
        result.Error.Message.Should().Be("Preferred name is required");
    }

    [Fact]
    public void ConvertToRegistered_when_preferred_name_null_returns_failure()
    {
        // Arrange
        var anonymousUser = User.CreateAnonymous();

        // Act
        var result = anonymousUser.ConvertToRegistered("test@example.com", null!);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().BeOfType<ValidationError.Required>();
        result.Error.Message.Should().Be("Preferred name is required");
    }

    // Registered User Tests
    [Fact]
    public void Create_when_valid_inputs_creates_registered_user()
    {
        // Arrange
        var emailHash = "hashed_email@example.com";
        var passwordHash = "hashed_password";

        // Act
        var result = User.Create(emailHash, passwordHash);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var user = result.Value!;
        user.Id.Should().NotBe(Guid.Empty);
        user.EmailHash.Should().Be(emailHash);
        user.PasswordHash.Should().Be(passwordHash);
        user.IsAnonymous.Should().BeFalse();
        user.EmailVerified.Should().BeFalse();
        user.IsActive.Should().BeTrue();
        user.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        user.DataExpiresAt.Should().BeNull();
    }

    [Fact]
    public void Create_when_email_hash_empty_returns_failure()
    {
        // Act
        var result = User.Create("", "password123");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().BeOfType<ValidationError.Required>();
        result.Error.Message.Should().Be("Email hash is required");
        result.Error.Code.Should().Be("VALIDATION_REQUIRED");
        result.Error.Category.Should().Be(ErrorCategory.Validation);
    }

    [Fact]
    public void Create_when_email_hash_null_returns_failure()
    {
        // Act
        var result = User.Create(null!, "password123");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().BeOfType<ValidationError.Required>();
        result.Error.Message.Should().Be("Email hash is required");
    }

    [Fact]
    public void Create_when_password_hash_empty_returns_failure()
    {
        // Act
        var result = User.Create("test@example.com", "");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().BeOfType<ValidationError.Required>();
        result.Error.Message.Should().Be("Password hash is required");
    }

    [Fact]
    public void Create_when_password_hash_null_returns_failure()
    {
        // Act
        var result = User.Create("test@example.com", null!);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().BeOfType<ValidationError.Required>();
        result.Error.Message.Should().Be("Password hash is required");
    }

    [Fact]
    public void VerifyEmail_sets_email_verified_and_updates_timestamp()
    {
        // Arrange
        var result = User.Create("test@example.com", "password123");
        var user = result.Value!;
        var originalUpdatedAt = user.UpdatedAt;

        // Act
        user.VerifyEmail();

        // Assert
        user.EmailVerified.Should().BeTrue();
        user.UpdatedAt.Should().NotBe(originalUpdatedAt);
        user.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void Deactivate_sets_active_false_and_updates_timestamp()
    {
        // Arrange
        var result = User.Create("test@example.com", "password123");
        var user = result.Value!;
        var originalUpdatedAt = user.UpdatedAt;

        // Act
        user.Deactivate();

        // Assert
        user.IsActive.Should().BeFalse();
        user.UpdatedAt.Should().NotBe(originalUpdatedAt);
        user.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void UpdatePassword_when_valid_hash_updates_password_and_timestamp()
    {
        // Arrange
        var createResult = User.Create("test@example.com", "password123");
        var user = createResult.Value!;
        var newPasswordHash = "new_password_hash";
        var originalUpdatedAt = user.UpdatedAt;

        // Act
        var result = user.UpdatePassword(newPasswordHash);

        // Assert
        result.IsSuccess.Should().BeTrue();
        user.PasswordHash.Should().Be(newPasswordHash);
        user.UpdatedAt.Should().NotBe(originalUpdatedAt);
        user.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void UpdatePassword_when_empty_hash_returns_failure()
    {
        // Arrange
        var createResult = User.Create("test@example.com", "password123");
        var user = createResult.Value!;

        // Act
        var result = user.UpdatePassword("");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().BeOfType<ValidationError.Required>();
        result.Error.Message.Should().Be("New password hash is required");
    }

    [Fact]
    public void UpdatePassword_when_null_hash_returns_failure()
    {
        // Arrange
        var createResult = User.Create("test@example.com", "password123");
        var user = createResult.Value!;

        // Act
        var result = user.UpdatePassword(null!);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().BeOfType<ValidationError.Required>();
        result.Error.Message.Should().Be("New password hash is required");
    }

    [Fact]
    public void UpdatePassword_when_whitespace_hash_returns_failure()
    {
        // Arrange
        var createResult = User.Create("test@example.com", "password123");
        var user = createResult.Value!;

        // Act
        var result = user.UpdatePassword("   ");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().BeOfType<ValidationError.Required>();
        result.Error.Message.Should().Be("New password hash is required");
    }

    // Privacy Properties Tests
    [Fact]
    public void registered_user_should_have_full_privacy_capabilities()
    {
        // Arrange
        var result = User.Create("test@example.com", "password123");
        var user = result.Value!;

        // Assert
        user.CanAccessCloudFeatures.Should().BeTrue("Registered users should access cloud features");
        user.CanExportData.Should().BeTrue("All users should be able to export their data");
        user.HasDataRetentionLimits.Should().BeFalse("Registered users should not have data retention limits");
    }

    [Fact]
    public void ConvertToRegistered_updates_updated_at_timestamp()
    {
        // Arrange
        var anonymousUser = User.CreateAnonymous();
        var originalUpdatedAt = anonymousUser.UpdatedAt;

        // Act
        var result = anonymousUser.ConvertToRegistered("test@example.com", "Test User");

        // Assert
        result.IsSuccess.Should().BeTrue();
        anonymousUser.UpdatedAt.Should().NotBe(originalUpdatedAt);
        anonymousUser.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }
}
