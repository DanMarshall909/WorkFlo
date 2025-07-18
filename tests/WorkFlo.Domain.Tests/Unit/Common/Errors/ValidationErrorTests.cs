using WorkFlo.Domain.Common.Errors;
using FluentAssertions;

namespace WorkFlo.Domain.Tests.Unit.Common.Errors;

/// <summary>
/// Unit tests for ValidationError types
/// </summary>
public class ValidationErrorTests
{
    [Fact]
    public void Required_creates_validation_error_with_correct_properties()
    {
        // Arrange
        var fieldName = "Email";

        // Act
        var error = new ValidationError.Required(fieldName);

        // Assert
        error.Code.Should().Be("VALIDATION_REQUIRED");
        error.Message.Should().Be("Email is required");
        error.Category.Should().Be(ErrorCategory.Validation);
    }

    [Fact]
    public void TooShort_creates_validation_error_with_correct_properties()
    {
        // Arrange
        var fieldName = "Password";
        var minLength = 8;

        // Act
        var error = new ValidationError.TooShort(fieldName, minLength);

        // Assert
        error.Code.Should().Be("VALIDATION_TOO_SHORT");
        error.Message.Should().Be("Password must be at least 8 characters");
        error.Category.Should().Be(ErrorCategory.Validation);
    }

    [Fact]
    public void TooLong_creates_validation_error_with_correct_properties()
    {
        // Arrange
        var fieldName = "Description";
        var maxLength = 500;

        // Act
        var error = new ValidationError.TooLong(fieldName, maxLength);

        // Assert
        error.Code.Should().Be("VALIDATION_TOO_LONG");
        error.Message.Should().Be("Description cannot exceed 500 characters");
        error.Category.Should().Be(ErrorCategory.Validation);
    }

    [Fact]
    public void InvalidFormat_creates_validation_error_with_correct_properties()
    {
        // Arrange
        var fieldName = "Email";
        var expectedFormat = "user@domain.com";

        // Act
        var error = new ValidationError.InvalidFormat(fieldName, expectedFormat);

        // Assert
        error.Code.Should().Be("VALIDATION_INVALID_FORMAT");
        error.Message.Should().Be("Email must be in format: user@domain.com");
        error.Category.Should().Be(ErrorCategory.Validation);
    }

    [Fact]
    public void OutOfRange_creates_validation_error_with_correct_properties()
    {
        // Arrange
        var fieldName = "Age";
        var allowedRange = "18-120";

        // Act
        var error = new ValidationError.OutOfRange(fieldName, allowedRange);

        // Assert
        error.Code.Should().Be("VALIDATION_OUT_OF_RANGE");
        error.Message.Should().Be("Age must be within range: 18-120");
        error.Category.Should().Be(ErrorCategory.Validation);
    }

    [Fact]
    public void ToString_returns_formatted_error_string()
    {
        // Arrange
        var error = new ValidationError.Required("Email");

        // Act
        var result = error.ToString();

        // Assert
        result.Should().Contain("VALIDATION_REQUIRED");
        result.Should().Contain("Email");

        // Check the custom ToString from DomainError base class
        var domainErrorString = error.ToString();
        domainErrorString.Should().Be("[Validation] VALIDATION_REQUIRED: Email is required");
    }
}
