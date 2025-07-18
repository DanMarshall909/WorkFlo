using WorkFlo.Domain.Common;
using WorkFlo.Domain.Common.Errors;
using FluentAssertions;

namespace WorkFlo.Domain.Tests.Unit.Common;

/// <summary>
/// Unit tests for TypeSafeResult<TError> class (without value)
/// </summary>
public class TypeSafeResultWithoutValueTests
{
    [Fact]
    public void Success_creates_successful_result()
    {
        // Act
        var result = TypeSafeResult<ValidationError>.Success();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.ErrorOrDefault.Should().BeNull();
    }

    [Fact]
    public void Failure_creates_failed_result_with_error()
    {
        // Arrange
        var error = new ValidationError.Required("Email");

        // Act
        var result = TypeSafeResult<ValidationError>.Failure(error);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(error);
        result.ErrorOrDefault.Should().Be(error);
    }

    [Fact]
    public void Error_when_failure_returns_error()
    {
        // Arrange
        var error = new ValidationError.Required("Field");
        var result = TypeSafeResult<ValidationError>.Failure(error);

        // Act
        var actualError = result.Error;

        // Assert
        actualError.Should().Be(error);
    }

    [Fact]
    public void Error_when_success_throws_exception()
    {
        // Arrange
        var result = TypeSafeResult<ValidationError>.Success();

        // Act & Assert
        var action = () => result.Error;
        action.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot access Error on a successful result");
    }

    [Fact]
    public void Match_with_return_value_calls_correct_function()
    {
        // Arrange
        var successResult = TypeSafeResult<ValidationError>.Success();
        var failureResult = TypeSafeResult<ValidationError>.Failure(new ValidationError.Required("Field"));

        // Act
        var successOutput = successResult.Match(
            onSuccess: () => "Success",
            onFailure: error => $"Error: {error.Message}"
        );

        var failureOutput = failureResult.Match(
            onSuccess: () => "Success",
            onFailure: error => $"Error: {error.Message}"
        );

        // Assert
        successOutput.Should().Be("Success");
        failureOutput.Should().Be("Error: Field is required");
    }

    [Fact]
    public void Match_with_actions_calls_correct_action()
    {
        // Arrange
        var successResult = TypeSafeResult<ValidationError>.Success();
        var failureResult = TypeSafeResult<ValidationError>.Failure(new ValidationError.Required("Field"));
        var successCalled = false;
        var failureCalled = false;
        var capturedError = default(ValidationError);

        // Act
        successResult.Match(
            onSuccess: () => { successCalled = true; },
            onFailure: error => { failureCalled = true; capturedError = error; }
        );

        // Assert for success
        successCalled.Should().BeTrue();
        failureCalled.Should().BeFalse();

        // Reset
        successCalled = false;
        failureCalled = false;

        // Act
        failureResult.Match(
            onSuccess: () => { successCalled = true; },
            onFailure: error => { failureCalled = true; capturedError = error; }
        );

        // Assert for failure
        successCalled.Should().BeFalse();
        failureCalled.Should().BeTrue();
        capturedError.Should().BeOfType<ValidationError.Required>();
    }

    [Fact]
    public void WithValue_when_success_creates_successful_result_with_value()
    {
        // Arrange
        var result = TypeSafeResult<ValidationError>.Success();
        var value = "test value";

        // Act
        var resultWithValue = result.WithValue(value);

        // Assert
        resultWithValue.IsSuccess.Should().BeTrue();
        resultWithValue.Value.Should().Be(value);
    }

    [Fact]
    public void WithValue_when_failure_creates_failed_result_with_error()
    {
        // Arrange
        var error = new ValidationError.Required("Field");
        var result = TypeSafeResult<ValidationError>.Failure(error);
        var value = "test value";

        // Act
        var resultWithValue = result.WithValue(value);

        // Assert
        resultWithValue.IsFailure.Should().BeTrue();
        resultWithValue.Error.Should().Be(error);
    }

    [Fact]
    public void ImplicitConversion_from_error_creates_failure()
    {
        // Arrange
        var error = new ValidationError.Required("Field");

        // Act
        TypeSafeResult<ValidationError> result = error;

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Be(error);
    }

    [Fact]
    public void ToString_success_returns_formatted_string()
    {
        // Arrange
        var result = TypeSafeResult<ValidationError>.Success();

        // Act
        var output = result.ToString();

        // Assert
        output.Should().Be("Success()");
    }

    [Fact]
    public void ToString_failure_returns_formatted_string()
    {
        // Arrange
        var error = new ValidationError.Required("Field");
        var result = TypeSafeResult<ValidationError>.Failure(error);

        // Act
        var output = result.ToString();

        // Assert
        output.Should().Be($"Failure({error})");
    }
}
