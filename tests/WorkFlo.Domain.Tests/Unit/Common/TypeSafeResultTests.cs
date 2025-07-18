using WorkFlo.Domain.Common;
using WorkFlo.Domain.Common.Errors;
using FluentAssertions;

namespace WorkFlo.Domain.Tests.Unit.Common;

/// <summary>
/// Unit tests for TypeSafeResult<T, TError> class
/// </summary>
public class TypeSafeResultTests
{
    [Fact]
    public void Success_creates_successful_result_with_value()
    {
        // Arrange
        var value = "test value";

        // Act
        var result = TypeSafeResult<string, ValidationError>.Success(value);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.Value.Should().Be(value);
        result.ValueOrDefault.Should().Be(value);
        result.ErrorOrDefault.Should().BeNull();
    }

    [Fact]
    public void Failure_creates_failed_result_with_error()
    {
        // Arrange
        var error = new ValidationError.Required("Email");

        // Act
        var result = TypeSafeResult<string, ValidationError>.Failure(error);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(error);
        result.ValueOrDefault.Should().BeNull();
        result.ErrorOrDefault.Should().Be(error);
    }

    [Fact]
    public void Value_when_success_returns_value()
    {
        // Arrange
        var value = 42;
        var result = TypeSafeResult<int, ValidationError>.Success(value);

        // Act
        var actualValue = result.Value;

        // Assert
        actualValue.Should().Be(value);
    }

    [Fact]
    public void Value_when_failure_throws_exception()
    {
        // Arrange
        var error = new ValidationError.Required("Field");
        var result = TypeSafeResult<string, ValidationError>.Failure(error);

        // Act & Assert
        var action = () => result.Value;
        action.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot access Value on a failed result");
    }

    [Fact]
    public void Error_when_failure_returns_error()
    {
        // Arrange
        var error = new ValidationError.Required("Field");
        var result = TypeSafeResult<string, ValidationError>.Failure(error);

        // Act
        var actualError = result.Error;

        // Assert
        actualError.Should().Be(error);
    }

    [Fact]
    public void Error_when_success_throws_exception()
    {
        // Arrange
        var result = TypeSafeResult<string, ValidationError>.Success("value");

        // Act & Assert
        var action = () => result.Error;
        action.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot access Error on a successful result");
    }

    [Fact]
    public void Match_with_return_value_calls_correct_function()
    {
        // Arrange
        var successResult = TypeSafeResult<string, ValidationError>.Success("value");
        var failureResult = TypeSafeResult<string, ValidationError>.Failure(new ValidationError.Required("Field"));

        // Act
        var successOutput = successResult.Match(
            onSuccess: value => $"Success: {value}",
            onFailure: error => $"Error: {error.Message}"
        );

        var failureOutput = failureResult.Match(
            onSuccess: value => $"Success: {value}",
            onFailure: error => $"Error: {error.Message}"
        );

        // Assert
        successOutput.Should().Be("Success: value");
        failureOutput.Should().Be("Error: Field is required");
    }

    [Fact]
    public void Match_with_actions_calls_correct_action()
    {
        // Arrange
        var successResult = TypeSafeResult<string, ValidationError>.Success("value");
        var failureResult = TypeSafeResult<string, ValidationError>.Failure(new ValidationError.Required("Field"));
        var successCalled = false;
        var failureCalled = false;
        var capturedValue = string.Empty;
        var capturedError = default(ValidationError);

        // Act
        successResult.Match(
            onSuccess: value => { successCalled = true; capturedValue = value; },
            onFailure: error => { failureCalled = true; capturedError = error; }
        );

        // Assert for success
        successCalled.Should().BeTrue();
        failureCalled.Should().BeFalse();
        capturedValue.Should().Be("value");

        // Reset
        successCalled = false;
        failureCalled = false;

        // Act
        failureResult.Match(
            onSuccess: value => { successCalled = true; capturedValue = value; },
            onFailure: error => { failureCalled = true; capturedError = error; }
        );

        // Assert for failure
        successCalled.Should().BeFalse();
        failureCalled.Should().BeTrue();
        capturedError.Should().BeOfType<ValidationError.Required>();
    }

    [Fact]
    public void Map_when_success_transforms_value()
    {
        // Arrange
        var result = TypeSafeResult<int, ValidationError>.Success(42);

        // Act
        var mappedResult = result.Map(value => value.ToString());

        // Assert
        mappedResult.IsSuccess.Should().BeTrue();
        mappedResult.Value.Should().Be("42");
    }

    [Fact]
    public void Map_when_failure_preserves_error()
    {
        // Arrange
        var error = new ValidationError.Required("Field");
        var result = TypeSafeResult<int, ValidationError>.Failure(error);

        // Act
        var mappedResult = result.Map(value => value.ToString());

        // Assert
        mappedResult.IsFailure.Should().BeTrue();
        mappedResult.Error.Should().Be(error);
    }

    [Fact]
    public void MapError_when_success_preserves_value()
    {
        // Arrange
        var result = TypeSafeResult<string, ValidationError>.Success("value");

        // Act
        var mappedResult = result.MapError(error => new BusinessRuleError.InvalidState("op", "state"));

        // Assert
        mappedResult.IsSuccess.Should().BeTrue();
        mappedResult.Value.Should().Be("value");
    }

    [Fact]
    public void MapError_when_failure_transforms_error()
    {
        // Arrange
        var originalError = new ValidationError.Required("Field");
        var result = TypeSafeResult<string, ValidationError>.Failure(originalError);

        // Act
        var mappedResult = result.MapError(error => new BusinessRuleError.InvalidState("operation", "state"));

        // Assert
        mappedResult.IsFailure.Should().BeTrue();
        mappedResult.Error.Should().BeOfType<BusinessRuleError.InvalidState>();
    }

    [Fact]
    public void Bind_when_success_calls_binder()
    {
        // Arrange
        var result = TypeSafeResult<int, ValidationError>.Success(42);

        // Act
        var boundResult = result.Bind(value =>
            value > 0
                ? TypeSafeResult<string, ValidationError>.Success(value.ToString())
                : TypeSafeResult<string, ValidationError>.Failure(new ValidationError.OutOfRange("Value", "positive"))
        );

        // Assert
        boundResult.IsSuccess.Should().BeTrue();
        boundResult.Value.Should().Be("42");
    }

    [Fact]
    public void Bind_when_failure_preserves_error()
    {
        // Arrange
        var error = new ValidationError.Required("Field");
        var result = TypeSafeResult<int, ValidationError>.Failure(error);

        // Act
        var boundResult = result.Bind(value => TypeSafeResult<string, ValidationError>.Success(value.ToString()));

        // Assert
        boundResult.IsFailure.Should().BeTrue();
        boundResult.Error.Should().Be(error);
    }

    [Fact]
    public void Bind_when_binder_returns_failure_returns_failure()
    {
        // Arrange
        var result = TypeSafeResult<int, ValidationError>.Success(-1);

        // Act
        var boundResult = result.Bind(value =>
            value > 0
                ? TypeSafeResult<string, ValidationError>.Success(value.ToString())
                : TypeSafeResult<string, ValidationError>.Failure(new ValidationError.OutOfRange("Value", "positive"))
        );

        // Assert
        boundResult.IsFailure.Should().BeTrue();
        boundResult.Error.Should().BeOfType<ValidationError.OutOfRange>();
    }

    [Fact]
    public void ImplicitConversion_from_value_creates_success()
    {
        // Act
        TypeSafeResult<string, ValidationError> result = "test value";

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be("test value");
    }

    [Fact]
    public void ImplicitConversion_from_error_creates_failure()
    {
        // Arrange
        var error = new ValidationError.Required("Field");

        // Act
        TypeSafeResult<string, ValidationError> result = error;

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Be(error);
    }

    [Fact]
    public void ToString_success_returns_formatted_string()
    {
        // Arrange
        var result = TypeSafeResult<string, ValidationError>.Success("test");

        // Act
        var output = result.ToString();

        // Assert
        output.Should().Be("Success(test)");
    }

    [Fact]
    public void ToString_failure_returns_formatted_string()
    {
        // Arrange
        var error = new ValidationError.Required("Field");
        var result = TypeSafeResult<string, ValidationError>.Failure(error);

        // Act
        var output = result.ToString();

        // Assert
        output.Should().Be($"Failure({error})");
    }
}
