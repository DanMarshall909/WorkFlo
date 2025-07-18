using WorkFlo.Domain.Common.Errors;
using FluentAssertions;

namespace WorkFlo.Domain.Tests.Unit.Common.Errors;

/// <summary>
/// Unit tests for UserError factory methods
/// </summary>
public class UserErrorTests
{
    [Fact]
    public void EmailHashRequired_creates_validation_error()
    {
        // Act
        var error = UserError.EmailHashRequired();

        // Assert
        error.Should().BeOfType<ValidationError.Required>();
        error.Message.Should().Be("Email hash is required");
        error.Code.Should().Be("VALIDATION_REQUIRED");
        error.Category.Should().Be(ErrorCategory.Validation);
    }

    [Fact]
    public void PasswordHashRequired_creates_validation_error()
    {
        // Act
        var error = UserError.PasswordHashRequired();

        // Assert
        error.Should().BeOfType<ValidationError.Required>();
        error.Message.Should().Be("Password hash is required");
        error.Code.Should().Be("VALIDATION_REQUIRED");
        error.Category.Should().Be(ErrorCategory.Validation);
    }

    [Fact]
    public void PreferredNameRequired_creates_validation_error()
    {
        // Act
        var error = UserError.PreferredNameRequired();

        // Assert
        error.Should().BeOfType<ValidationError.Required>();
        error.Message.Should().Be("Preferred name is required");
        error.Code.Should().Be("VALIDATION_REQUIRED");
        error.Category.Should().Be(ErrorCategory.Validation);
    }

    [Fact]
    public void NewPasswordHashRequired_creates_validation_error()
    {
        // Act
        var error = UserError.NewPasswordHashRequired();

        // Assert
        error.Should().BeOfType<ValidationError.Required>();
        error.Message.Should().Be("New password hash is required");
        error.Code.Should().Be("VALIDATION_REQUIRED");
        error.Category.Should().Be(ErrorCategory.Validation);
    }

    [Fact]
    public void AlreadyRegistered_creates_business_rule_error()
    {
        // Act
        var error = UserError.AlreadyRegistered();

        // Assert
        error.Should().BeOfType<BusinessRuleError.InvalidUserState>();
        error.Message.Should().Be("User must be 'anonymous' but is currently 'registered'");
        error.Code.Should().Be("BUSINESS_INVALID_USER_STATE");
        error.Category.Should().Be(ErrorCategory.BusinessRule);
    }
}
