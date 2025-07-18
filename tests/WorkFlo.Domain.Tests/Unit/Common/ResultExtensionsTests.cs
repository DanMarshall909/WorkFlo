using WorkFlo.Domain.Common;
using FluentAssertions;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Domain.Tests.Unit.Common;

/// <summary>
/// Unit tests for ResultExtensions static methods
/// Tests extension methods for creating and checking Result instances
/// </summary>
public class ResultExtensionsTests
{
    [Fact]
    public void Success_creates_successful_generic_result()
    {
        // Arrange
        var testValue = "test value";

        // Act
        var result = Success(testValue);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(testValue);
        result.Error.Should().BeNull();
    }

    [Fact]
    public void Success_when_null_value_creates_successful_result_with_null()
    {
        // Act
        var result = Success<string>(null!);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeNull();
        result.Error.Should().BeNull();
    }

    [Fact]
    public void Failure_creates_failed_generic_result()
    {
        // Arrange
        var errorMessage = "Test error";

        // Act
        var result = Failure<string>(errorMessage);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Error.Should().Be(errorMessage);
    }

    [Fact]
    public void Failure_when_null_error_creates_failed_result_with_null_error()
    {
        // Act
        var result = Failure<string>(null!);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Error.Should().BeNull();
    }

    [Fact]
    public void IsFailure_generic_returns_true_for_failed_result()
    {
        // Arrange
        var result = Failure<string>("error");

        // Act
        var isFailure = result.IsFailure();

        // Assert
        isFailure.Should().BeTrue();
    }

    [Fact]
    public void IsFailure_generic_returns_false_for_successful_result()
    {
        // Arrange
        var result = Success("value");

        // Act
        var isFailure = result.IsFailure();

        // Assert
        isFailure.Should().BeFalse();
    }

    [Fact]
    public void IsFailure_non_generic_returns_true_for_failed_result()
    {
        // Arrange
        var result = Result.Failure("error");

        // Act
        var isFailure = result.IsFailure();

        // Assert
        isFailure.Should().BeTrue();
    }

    [Fact]
    public void IsFailure_non_generic_returns_false_for_successful_result()
    {
        // Arrange
        var result = Result.Success();

        // Act
        var isFailure = result.IsFailure();

        // Assert
        isFailure.Should().BeFalse();
    }
}
