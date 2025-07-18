using WorkFlo.Domain.Common;
using FluentAssertions;
using static WorkFlo.Domain.Common.ResultExtensions;

namespace WorkFlo.Domain.Tests.Unit.Common;

/// <summary>
/// Unit tests for Result and Result<T> classes
/// Tests success and failure result creation and properties
/// </summary>
public class ResultTests
{
    [Fact]
    public void Success_creates_successful_result()
    {
        // Act
        var result = Result.Success();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Error.Should().BeNull();
    }

    [Fact]
    public void Failure_creates_failed_result_with_error()
    {
        // Arrange
        var errorMessage = "Test error";

        // Act
        var result = Result.Failure(errorMessage);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(errorMessage);
    }

    [Fact]
    public void Failure_when_null_error_stores_null()
    {
        // Act
        var result = Result.Failure(null!);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().BeNull();
    }

    [Fact]
    public void Failure_when_empty_error_stores_empty_string()
    {
        // Act
        var result = Result.Failure(string.Empty);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(string.Empty);
    }
}

/// <summary>
/// Unit tests for generic Result<T> class
/// Tests typed result creation and value handling
/// </summary>
public class GenericResultTests
{
    [Fact]
    public void CreateSuccess_stores_value_and_marks_successful()
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
    public void CreateSuccess_when_null_value_stores_null()
    {
        // Act
        var result = Success<string>(null!);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeNull();
        result.Error.Should().BeNull();
    }

    [Fact]
    public void CreateFailure_stores_error_and_marks_failed()
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
    public void CreateFailure_when_null_error_stores_null_error()
    {
        // Act
        var result = Failure<string>(null!);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Error.Should().BeNull();
    }

    [Fact]
    public void CreateFailure_sets_value_to_default()
    {
        // Act
        var result = Failure<int>("error");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Value.Should().Be(0); // default(int)
        result.Error.Should().Be("error");
    }

    [Fact]
    public void CreateFailure_for_reference_type_sets_value_to_null()
    {
        // Act
        var result = Failure<object>("error");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Error.Should().Be("error");
    }
}
