using WorkFlo.Domain.Common.Errors;
using FluentAssertions;

namespace WorkFlo.Domain.Tests.Unit.Common.Errors;

/// <summary>
/// Unit tests for BusinessRuleError types
/// </summary>
public class BusinessRuleErrorTests
{
    [Fact]
    public void InvalidState_creates_business_rule_error_with_correct_properties()
    {
        // Arrange
        var operation = "delete";
        var currentState = "archived";

        // Act
        var error = new BusinessRuleError.InvalidState(operation, currentState);

        // Assert
        error.Code.Should().Be("BUSINESS_INVALID_STATE");
        error.Message.Should().Be("Cannot delete when in state: archived");
        error.Category.Should().Be(ErrorCategory.BusinessRule);
    }

    [Fact]
    public void AlreadyExists_creates_business_rule_error_with_correct_properties()
    {
        // Arrange
        var resourceType = "User";
        var identifier = "john@example.com";

        // Act
        var error = new BusinessRuleError.AlreadyExists(resourceType, identifier);

        // Assert
        error.Code.Should().Be("BUSINESS_ALREADY_EXISTS");
        error.Message.Should().Be("User with identifier 'john@example.com' already exists");
        error.Category.Should().Be(ErrorCategory.BusinessRule);
    }

    [Fact]
    public void ConstraintViolation_creates_business_rule_error_with_correct_properties()
    {
        // Arrange
        var constraintName = "unique_email";
        var description = "Email must be unique across all users";

        // Act
        var error = new BusinessRuleError.ConstraintViolation(constraintName, description);

        // Assert
        error.Code.Should().Be("BUSINESS_CONSTRAINT_VIOLATION");
        error.Message.Should().Be("Domain constraint 'unique_email' violated: Email must be unique across all users");
        error.Category.Should().Be(ErrorCategory.BusinessRule);
    }

    [Fact]
    public void InvalidUserState_creates_business_rule_error_with_correct_properties()
    {
        // Arrange
        var requiredState = "active";
        var currentState = "suspended";

        // Act
        var error = new BusinessRuleError.InvalidUserState(requiredState, currentState);

        // Assert
        error.Code.Should().Be("BUSINESS_INVALID_USER_STATE");
        error.Message.Should().Be("User must be 'active' but is currently 'suspended'");
        error.Category.Should().Be(ErrorCategory.BusinessRule);
    }

    [Fact]
    public void ToString_returns_formatted_error_string()
    {
        // Arrange
        var error = new BusinessRuleError.InvalidState("activate", "deleted");

        // Act
        var result = error.ToString();

        // Assert
        result.Should().Contain("BUSINESS_INVALID_STATE");
        result.Should().Contain("activate");
        result.Should().Contain("deleted");

        // Check the custom ToString from DomainError base class
        var domainErrorString = error.ToString();
        domainErrorString.Should().Be("[BusinessRule] BUSINESS_INVALID_STATE: Cannot activate when in state: deleted");
    }
}
